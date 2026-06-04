import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id

    const okoaClients = await db.user.findMany({
      where: { memberId: userId, role: "client", okoaUsed: { gt: 0 } },
      select: {
        id: true, name: true, email: true,
        okoaBalance: true, okoaLimit: true, okoaUsed: true,
        status: true, phone: true,
      },
    })

    const totalCredit = okoaClients.reduce((s, c) => s + c.okoaBalance, 0)
    const totalLimit = okoaClients.reduce((s, c) => s + c.okoaLimit, 0)
    const totalUsed = okoaClients.reduce((s, c) => s + c.okoaUsed, 0)

    // Get recent OKOA transactions
    const recentTransactions = await db.transaction.findMany({
      where: { type: { in: ["okoa", "repayment"] }, user: { memberId: userId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    })

    return NextResponse.json({
      data: {
        clients: okoaClients,
        totalCredit,
        totalLimit,
        totalUsed,
        recentTransactions,
      },
    })
  } catch (error) {
    console.error("Member okoa GET error:", error)
    return NextResponse.json({ error: "Failed to fetch OKOA data" }, { status: 500 })
  }
}
