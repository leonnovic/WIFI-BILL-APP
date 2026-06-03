import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getNotificationService } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const memberId = (session.user as any).id
    const body = await request.json()
    const { clientId, amount, mpesaCode } = body

    if (!clientId || !amount) {
      return NextResponse.json({ error: "Client ID and amount are required" }, { status: 400 })
    }

    const repayAmount = parseFloat(amount)
    if (repayAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    // Ensure client belongs to this member
    const client = await db.user.findFirst({
      where: { id: clientId, memberId, role: "client" },
    })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    if (client.okoaBalance <= 0) {
      return NextResponse.json({ error: "Client has no OKOA debt" }, { status: 400 })
    }

    // Calculate repayment amount (cannot exceed debt)
    const actualRepay = Math.min(repayAmount, client.okoaBalance)

    // Update client OKOA balance
    await db.user.update({
      where: { id: clientId },
      data: {
        okoaBalance: { decrement: actualRepay },
      },
    })

    // Create repayment transaction
    const transaction = await db.transaction.create({
      data: {
        userId: clientId,
        amount: actualRepay,
        type: "repayment",
        status: "completed",
        mpesaCode: mpesaCode || null,
        mpesaPhone: client.phone,
        description: `OKOA repayment: KES ${actualRepay}`,
      },
    })

    // Notify client
    getNotificationService().notify({
      userId: clientId,
      title: "OKOA Repayment Received",
      message: `KES ${actualRepay} received towards your OKOA debt. Remaining: KES ${client.okoaBalance - actualRepay}`,
      type: "success",
      sendSMS: true,
    }).catch(err => console.error("Notification error:", err))

    return NextResponse.json({
      data: { transaction, remainingDebt: client.okoaBalance - actualRepay },
      message: "OKOA repayment processed successfully",
    })

  } catch (error) {
    console.error("Member okoa repay error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
