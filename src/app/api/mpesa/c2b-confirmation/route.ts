import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getNotificationService } from "@/lib/notifications"

/**
 * M-Pesa C2B Confirmation URL
 * Called by Safaricom to confirm a C2B transaction after validation passes
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("C2B Confirmation received:", JSON.stringify(data, null, 2))

    const {
      TransID,
      MSISDN,
      BillRefNumber,
      TransAmount,
      BusinessShortCode,
      FirstName,
      MiddleName,
      LastName,
      OrgAccountBalance,
    } = data

    const amount = parseFloat(TransAmount)
    const phoneNumber = MSISDN
    const accountRef = BillRefNumber?.trim()

    // Try to match the payment to a user
    // The BillRefNumber could be: email, phone, user ID, or transaction ID
    let user = null
    let matchedTransaction = null

    // Try matching by transaction ID (e.g., ISPL-xxxxxxxx)
    if (accountRef?.startsWith("ISPL-")) {
      const txSuffix = accountRef.replace("ISPL-", "")
      matchedTransaction = await db.transaction.findFirst({
        where: {
          id: { contains: txSuffix },
          status: "pending",
        },
        include: { user: true, package: true },
      })
      if (matchedTransaction) {
        user = matchedTransaction.user
      }
    }

    // Try matching by email
    if (!user && accountRef?.includes("@")) {
      user = await db.user.findUnique({
        where: { email: accountRef.toLowerCase() },
      })
    }

    // Try matching by phone
    if (!user) {
      user = await db.user.findFirst({
        where: { phone: phoneNumber },
      })
    }

    // Try matching by user ID
    if (!user && accountRef) {
      user = await db.user.findUnique({
        where: { id: accountRef },
      })
    }

    if (!user) {
      console.log(`C2B: Could not match payment to user. TransID: ${TransID}, Ref: ${accountRef}`)
      // Create an unlinked transaction record
      // In production, this should be handled by support
      return NextResponse.json({ received: true })
    }

    // If we matched a pending transaction, complete it
    if (matchedTransaction && matchedTransaction.status === "pending") {
      await db.transaction.update({
        where: { id: matchedTransaction.id },
        data: {
          status: "completed",
          mpesaCode: TransID,
          mpesaPhone: phoneNumber,
          mpesaReceipt: TransID,
          description: `C2B payment confirmed. M-Pesa Ref: ${TransID}`,
        },
      })

      // Activate package if applicable
      if (matchedTransaction.packageId && matchedTransaction.package) {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + matchedTransaction.package.duration)

        await db.user.update({
          where: { id: user.id },
          data: {
            activePackageId: matchedTransaction.packageId,
            packageExpiry: expiry,
            dataLimit: matchedTransaction.package.dataLimitMB || 0,
            dataUsed: 0,
            connectionStatus: "connected",
          },
        })
      }
    } else {
      // Create a new transaction for unmatched payment
      await db.transaction.create({
        data: {
          userId: user.id,
          amount,
          type: "topup",
          status: "completed",
          mpesaCode: TransID,
          mpesaPhone: phoneNumber,
          mpesaReceipt: TransID,
          description: `C2B payment received. M-Pesa Ref: ${TransID}${accountRef ? `, Ref: ${accountRef}` : ""}`,
        },
      })
    }

    // Notify user
    getNotificationService().notify({
      userId: user.id,
      title: "Payment Received",
      message: `KES ${amount} received. M-Pesa Ref: ${TransID}`,
      type: "success",
      sendSMS: true,
    }).catch(err => console.error("Notification error:", err))

    console.log(`C2B confirmed: KES ${amount} from ${phoneNumber}, Ref: ${TransID}, User: ${user.email}`)

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("C2B Confirmation error:", error)
    // Always return 200 to M-Pesa
    return NextResponse.json({ received: true })
  }
}
