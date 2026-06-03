import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getMpesaAPI } from "@/lib/mpesa"
import { getNotificationService } from "@/lib/notifications"
import { getEmailService } from "@/lib/email"
import { getSMSAPI } from "@/lib/sms"
import { provisionClientOnRouter } from "@/lib/mikrotik"

/**
 * M-Pesa STK Push Callback Handler
 * Called by Safaricom when an STK Push transaction completes
 */
export async function POST(request: Request) {
  try {
    const callbackData = await request.json()

    console.log("M-Pesa STK Callback received:", JSON.stringify(callbackData, null, 2))

    const mpesa = getMpesaAPI()
    const result = mpesa.parseSTKCallback(callbackData)

    if (!result) {
      console.error("Failed to parse M-Pesa callback")
      return NextResponse.json({ error: "Invalid callback data" }, { status: 400 })
    }

    // If transaction failed
    if (result.ResultCode !== 0) {
      console.log(`STK Push failed: ${result.ResultDesc}`)

      // Find the pending transaction by M-Pesa reference
      // We store the MerchantRequestID in the description
      const pendingTx = await db.transaction.findFirst({
        where: {
          status: "pending",
          type: "purchase",
          description: { contains: result.MerchantRequestID || "" },
        },
      })

      if (pendingTx) {
        await db.transaction.update({
          where: { id: pendingTx.id },
          data: {
            status: "failed",
            description: `M-Pesa payment failed: ${result.ResultDesc}`,
          },
        })
      }

      return NextResponse.json({ received: true })
    }

    // Transaction succeeded
    const {
      Amount,
      MpesaReceiptNumber,
      PhoneNumber,
      TransactionDate,
      MerchantRequestID,
    } = result

    if (!Amount || !MpesaReceiptNumber || !PhoneNumber) {
      console.error("Missing required fields in successful callback")
      return NextResponse.json({ received: true })
    }

    // Find the pending transaction
    const pendingTx = await db.transaction.findFirst({
      where: {
        status: "pending",
        type: "purchase",
        description: { contains: MerchantRequestID || "" },
      },
      include: {
        user: { include: { member: true } },
        package: true,
      },
    })

    if (!pendingTx) {
      console.error("No matching pending transaction found")
      return NextResponse.json({ received: true })
    }

    // Calculate OKOA deduction if applicable
    let okoaDeduction = 0
    if (pendingTx.user.okoaBalance > 0 && pendingTx.okoaAmount > 0) {
      okoaDeduction = Math.min(pendingTx.user.okoaBalance, pendingTx.okoaAmount)
    }

    // Update transaction as completed
    await db.transaction.update({
      where: { id: pendingTx.id },
      data: {
        status: "completed",
        mpesaCode: MpesaReceiptNumber,
        mpesaPhone: PhoneNumber,
        mpesaReceipt: MpesaReceiptNumber,
        okoaAmount: okoaDeduction,
        description: `Payment confirmed. M-Pesa Ref: ${MpesaReceiptNumber}${okoaDeduction > 0 ? `. OKOA deduction: KES ${okoaDeduction}` : ""}`,
      },
    })

    // Deduct OKOA balance if applicable
    if (okoaDeduction > 0) {
      await db.user.update({
        where: { id: pendingTx.userId },
        data: {
          okoaBalance: { decrement: okoaDeduction },
        },
      })
    }

    // Activate the package for the user
    if (pendingTx.packageId && pendingTx.package) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + pendingTx.package.duration)

      await db.user.update({
        where: { id: pendingTx.userId },
        data: {
          activePackageId: pendingTx.packageId,
          packageExpiry: expiry,
          dataLimit: pendingTx.package.dataLimitMB || 0,
          dataUsed: 0,
          connectionStatus: "connected",
        },
      })

      // Try to provision on router if user has an ISP member with routers
      const user = pendingTx.user
      if (user.memberId) {
        const routers = await db.router.findMany({
          where: { ownerId: user.memberId, status: "online" },
          take: 1,
        })

        if (routers.length > 0) {
          const router = routers[0]
          provisionClientOnRouter(
            {
              host: router.ipAddress,
              port: 8728,
              username: router.username,
              password: router.password,
            },
            {
              username: user.email.split("@")[0],
              password: user.id.slice(-8), // Use last 8 chars of ID as temp password
              profileName: pendingTx.package.name.replace(/\s+/g, "_"),
              comment: `ISPLedger: ${user.name} - ${pendingTx.package.name}`,
              limitUptime: `${pendingTx.package.duration}d`,
            }
          ).catch(err => {
            console.error("Router provisioning failed:", err)
          })
        }
      }
    }

    // Send notifications
    const client = pendingTx.user
    const pkg = pendingTx.package

    // SMS notification
    if (client.phone) {
      getSMSAPI().sendPaymentConfirmation(
        client.phone,
        Amount,
        pkg?.name || "Package",
        MpesaReceiptNumber
      ).catch(err => console.error("Payment confirmation SMS error:", err))

      getSMSAPI().sendPackageActivation(
        client.phone,
        pkg?.name || "Package",
        pkg?.durationStr || "30d"
      ).catch(err => console.error("Package activation SMS error:", err))
    }

    // Email receipt
    if (client.email) {
      getEmailService().sendPaymentReceipt(client.email, {
        name: client.name || "Client",
        packageName: pkg?.name || "Package",
        amount: Amount,
        mpesaCode: MpesaReceiptNumber,
        date: new Date().toLocaleDateString(),
        duration: pkg?.durationStr || "30d",
      }).catch(err => console.error("Payment receipt email error:", err))
    }

    // In-app notification
    getNotificationService().notify({
      userId: client.id,
      title: "Payment Successful",
      message: `Your payment of KES ${Amount} for ${pkg?.name || "Package"} was successful. M-Pesa Ref: ${MpesaReceiptNumber}`,
      type: "success",
    }).catch(err => console.error("Notification error:", err))

    // Update router connected clients count
    if (client.memberId) {
      await db.router.updateMany({
        where: { ownerId: client.memberId },
        data: { connectedClients: { increment: 1 } },
      })
    }

    console.log(`Payment completed: KES ${Amount} from ${PhoneNumber}, Ref: ${MpesaReceiptNumber}`)

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("M-Pesa callback error:", error)
    // Always return 200 to M-Pesa so they don't retry
    return NextResponse.json({ received: true })
  }
}
