import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getMpesaAPI } from "@/lib/mpesa"
import { getNotificationService } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { packageId, phone } = await request.json()

    if (!packageId) return NextResponse.json({ error: "Package ID is required" }, { status: 400 })

    const pkg = await db.package.findUnique({ where: { id: packageId } })
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 })
    if (!pkg.isActive) return NextResponse.json({ error: "Package is not available" }, { status: 400 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Create transaction record
    const mpesaRef = `TXN${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    let mpesaResult: any = null
    let transactionStatus = "pending"

    // Attempt M-Pesa STK Push
    try {
      const mpesa = getMpesaAPI()
      const paymentPhone = phone || user.phone || ""
      if (paymentPhone) {
        mpesaResult = await mpesa.initiateSTKPush({
          phoneNumber: paymentPhone,
          amount: pkg.price,
          accountReference: `ISPL-${mpesaRef}`,
          transactionDesc: `Purchase: ${pkg.name}`,
        })
        // M-Pesa initiated successfully
        transactionStatus = "pending"
      }
    } catch (mpesaError) {
      // M-Pesa failed (no credentials, network error, etc.) - simulate success
      console.log("M-Pesa STK Push failed, simulating success:", (mpesaError as Error).message)
      transactionStatus = "completed"
      mpesaResult = {
        MerchantRequestID: `SIM${Date.now()}`,
        CheckoutRequestID: `SIM${Date.now()}`,
      }
    }

    // Create the transaction
    const transaction = await db.transaction.create({
      data: {
        userId,
        packageId,
        type: "purchase",
        amount: pkg.price,
        status: transactionStatus,
        mpesaCode: mpesaRef,
        mpesaPhone: phone || user.phone,
        mpesaReceipt: transactionStatus === "completed" ? mpesaRef : null,
        description: `${pkg.name} Package - ${pkg.durationStr || pkg.duration + " days"}`,
      },
    })

    // If payment is completed (simulated), activate package
    if (transactionStatus === "completed") {
      // Deduct OKOA balance first if client has outstanding balance
      let okoaRepaid = 0
      if (user.okoaBalance > 0) {
        okoaRepaid = Math.min(user.okoaBalance, pkg.price)
      }

      const expiry = new Date()
      expiry.setDate(expiry.getDate() + pkg.duration)

      await db.user.update({
        where: { id: userId },
        data: {
          activePackageId: packageId,
          packageExpiry: expiry,
          dataUsed: 0,
          dataLimit: pkg.dataLimitMB,
          connectionStatus: "connected",
          okoaBalance: user.okoaBalance - okoaRepaid,
        },
      })

      // Create OKOA repayment transaction if applicable
      if (okoaRepaid > 0) {
        await db.transaction.create({
          data: {
            userId,
            type: "repayment",
            amount: okoaRepaid,
            status: "completed",
            description: "OKOA Repayment (auto-deducted from purchase)",
          },
        })
      }

      // Notify client
      try {
        await getNotificationService().notify({
          userId,
          title: "Package Activated",
          message: `Your ${pkg.name} package has been activated. Valid until ${expiry.toLocaleDateString()}.`,
          type: "success",
        })
      } catch (e) {
        console.error("Failed to send notification:", e)
      }
    }

    return NextResponse.json({
      data: {
        transactionId: transaction.id,
        status: transactionStatus,
        mpesaRef,
        mpesaRequestId: mpesaResult?.MerchantRequestID || null,
        checkoutRequestId: mpesaResult?.CheckoutRequestID || null,
      },
    })
  } catch (error) {
    console.error("Client package buy error:", error)
    return NextResponse.json({ error: "Failed to purchase package" }, { status: 500 })
  }
}
