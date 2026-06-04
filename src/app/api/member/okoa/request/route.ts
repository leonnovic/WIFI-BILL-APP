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
    const { clientId, amount, approve } = await request.json()

    if (!clientId || !amount) return NextResponse.json({ error: "Client ID and amount are required" }, { status: 400 })
    if (amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })

    // Verify this client belongs to this member
    const client = await db.user.findFirst({
      where: { id: clientId, memberId: userId, role: "client" },
    })
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

    if (approve) {
      const serviceFee = amount * 0.1
      const totalDebt = amount + serviceFee
      const newBalance = client.okoaBalance + totalDebt

      if (newBalance > client.okoaLimit) {
        return NextResponse.json(
          { error: `Exceeds credit limit. Current balance: ${client.okoaBalance}, Requested total: ${totalDebt}, Limit: ${client.okoaLimit}` },
          { status: 400 }
        )
      }

      // Update client OKOA balance
      await db.user.update({
        where: { id: clientId },
        data: {
          okoaBalance: newBalance,
          okoaUsed: client.okoaUsed + amount,
        },
      })

      // Create transaction
      await db.transaction.create({
        data: {
          userId: clientId,
          type: "okoa",
          amount: totalDebt,
          status: "completed",
          okoaAmount: amount,
          serviceFee,
          description: `OKOA Internet Credit - Approved by ISP`,
        },
      })

      // Notify client
      try {
        await getNotificationService().notify({
          userId: clientId,
          title: "OKOA Credit Approved",
          message: `Your OKOA request of KES ${amount} has been approved. Service fee: KES ${serviceFee}. Total debt: KES ${totalDebt}`,
          type: "success",
        })
      } catch (e) {
        console.error("Failed to notify client:", e)
      }
    } else {
      // Notify client of rejection
      try {
        await getNotificationService().notify({
          userId: clientId,
          title: "OKOA Credit Rejected",
          message: `Your OKOA request of KES ${amount} has been rejected by your ISP.`,
          type: "warning",
        })
      } catch (e) {
        console.error("Failed to notify client:", e)
      }
    }

    return NextResponse.json({ data: { success: true, approved: !!approve } })
  } catch (error) {
    console.error("Member okoa request error:", error)
    return NextResponse.json({ error: "Failed to process OKOA request" }, { status: 500 })
  }
}
