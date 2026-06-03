import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
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

    // Get stats for this member's ISP business
    const [
      totalClients,
      activeClients,
      totalPackages,
      activeRouters,
      revenueResult,
      openTickets,
      recentTransactions,
    ] = await Promise.all([
      db.user.count({ where: { memberId, role: "client" } }),
      db.user.count({ where: { memberId, role: "client", isActive: true, connectionStatus: "connected" } }),
      db.package.count({ where: { ispId: memberId, isActive: true } }),
      db.router.count({ where: { ownerId: memberId, status: "online" } }),
      db.transaction.aggregate({
        where: {
          type: "purchase",
          status: "completed",
          user: { memberId },
        },
        _sum: { amount: true },
      }),
      db.ticket.count({
        where: {
          ispId: memberId,
          status: { in: ["open", "in_progress"] },
        },
      }),
      db.transaction.findMany({
        where: {
          user: { memberId },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          package: { select: { id: true, name: true, price: true } },
        },
      }),
    ])

    // Monthly revenue chart data
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlyTransactions = await db.transaction.findMany({
      where: {
        type: "purchase",
        status: "completed",
        user: { memberId },
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    const monthMap = new Map<string, number>()
    for (const tx of monthlyTransactions) {
      const key = tx.createdAt.toISOString().slice(0, 7)
      monthMap.set(key, (monthMap.get(key) || 0) + tx.amount)
    }
    const monthlyRevenue: { month: string; revenue: number }[] = []
    monthMap.forEach((revenue, month) => {
      monthlyRevenue.push({ month, revenue: Math.round(revenue * 100) / 100 })
    })

    return NextResponse.json({
      data: {
        stats: {
          totalClients,
          activeClients,
          totalPackages,
          activeRouters,
          revenue: revenueResult._sum.amount || 0,
          openTickets,
        },
        monthlyRevenue,
        recentTransactions,
      },
    })

  } catch (error) {
    console.error("Member dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
