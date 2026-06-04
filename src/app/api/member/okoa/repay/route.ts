import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getNotificationService } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { clientId, amount } = await request.json()

    if (!clientId || !amount) return NextResponse.json({ error: "Client ID and amount are required" }, { status: 400 })
    if (amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })

    // Verify this client belongs to this member
    const client = await db.user.findFirst({
      where: { id: clientId, memberId: userId, role: "client" },
    })
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

    if (client.okoaBalance <= 0) {
      return NextResponse.json({ error: "Client has no outstanding OKOA balance" }, { status: 400 })
    }

    const repayAmount = Math.min(amount, client.okoaBalance)

    // Update client OKOA balance
    await db.user.update({
      where: { id: clientId },
      data: {
        okoaBalance: client.okoaBalance - repayAmount,
      },
    })

    // Create repayment transaction
    await db.transaction.create({
      data: {
        userId: clientId,
        type: "repayment",
        amount: repayAmount,
        status: "completed",
        description: "OKOA Repayment - Processed by ISP",
      },
    })

    // Notify client
    try {
      await getNotificationService().notify({
        userId: clientId,
        title: "OKOA Repayment Processed",
        message: `Your OKOA repayment of KES ${repayAmount} has been processed. Remaining balance: KES ${client.okoaBalance - repayAmount}`,
        type: "success",
      })
    } catch (e) {
      console.error("Failed to notify client:", e)
    }

    return NextResponse.json({
      data: {
        success: true,
        repaid: repayAmount,
        remainingBalance: client.okoaBalance - repayAmount,
      },
    })
  } catch (error) {
    console.error("Member okoa repay error:", error)
    return NextResponse.json({ error: "Failed to process repayment" }, { status: 500 })
  }
}
