import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getMpesaAPI } from "@/lib/mpesa"
import { getNotificationService } from "@/lib/notifications"
import { provisionClientOnRouter } from "@/lib/mikrotik"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = (session.user as any).id
    const body = await request.json()
    const { packageId, phone } = body

    if (!packageId) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 })
    }

    // Get client info
    const client = await db.user.findUnique({
      where: { id: clientId },
      include: { member: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get package info
    const pkg = await db.package.findUnique({
      where: { id: packageId },
    })

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    if (!pkg.isActive) {
      return NextResponse.json({ error: "This package is no longer available" }, { status: 400 })
    }

    // Check if OKOA debt should be deducted
    let okoaDeduction = 0
    if (client.okoaBalance > 0) {
      okoaDeduction = Math.min(client.okoaBalance, pkg.price)
    }

    const totalAmount = pkg.price

    // Create pending transaction
    const transaction = await db.transaction.create({
      data: {
        userId: clientId,
        packageId: pkg.id,
        amount: totalAmount,
        type: "purchase",
        status: "pending",
        okoaAmount: okoaDeduction,
        description: `Purchase of ${pkg.name} package${okoaDeduction > 0 ? ` (KES ${okoaDeduction} OKOA debt deduction)` : ""}`,
      },
    })

    // Initiate M-Pesa STK Push
    const mpesaPhone = phone || client.phone
    if (!mpesaPhone) {
      return NextResponse.json({ error: "Phone number is required for M-Pesa payment" }, { status: 400 })
    }

    try {
      const mpesaResponse = await getMpesaAPI().initiateSTKPush({
        phoneNumber: mpesaPhone,
        amount: totalAmount,
        accountReference: `ISPL-${transaction.id.slice(-8)}`,
        transactionDesc: `${pkg.name} package purchase`,
      })

      // Update transaction with M-Pesa details
      await db.transaction.update({
        where: { id: transaction.id },
        data: {
          mpesaPhone,
          description: `M-Pesa STK initiated. MerchantRequestID: ${mpesaResponse.MerchantRequestID}`,
        },
      })

      return NextResponse.json({
        data: {
          transactionId: transaction.id,
          checkoutRequestId: mpesaResponse.CheckoutRequestID,
          merchantRequestId: mpesaResponse.MerchantRequestID,
          amount: totalAmount,
          packageName: pkg.name,
          message: "M-Pesa payment initiated. Please check your phone and enter your PIN to complete the payment.",
        },
      })

    } catch (mpesaError: any) {
      // If M-Pesa fails, still create the transaction but mark as failed
      await db.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "failed",
          description: `M-Pesa STK push failed: ${mpesaError.message}`,
        },
      })

      return NextResponse.json({
        error: "Failed to initiate M-Pesa payment. Please try again.",
        details: mpesaError.message,
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Client buy package error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
