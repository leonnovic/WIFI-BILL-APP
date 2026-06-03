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
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get stats in parallel
    const [
      totalUsers,
      activeMembers,
      activeClients,
      revenueResult,
      activeRouters,
      openTickets,
    ] = await Promise.all([
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { role: "member", isActive: true } }),
      db.user.count({ where: { role: "client", isActive: true } }),
      db.transaction.aggregate({
        where: { status: "completed", type: "purchase" },
        _sum: { amount: true },
      }),
      db.router.count({ where: { status: "online" } }),
      db.ticket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    ])

    // Monthly revenue for chart (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlyTransactions = await db.transaction.findMany({
      where: {
        status: "completed",
        type: "purchase",
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    // Group by month
    const monthlyRevenue: { month: string; revenue: number }[] = []
    const monthMap = new Map<string, number>()
    for (const tx of monthlyTransactions) {
      const key = tx.createdAt.toISOString().slice(0, 7) // YYYY-MM
      monthMap.set(key, (monthMap.get(key) || 0) + tx.amount)
    }
    monthMap.forEach((revenue, month) => {
      monthlyRevenue.push({ month, revenue: Math.round(revenue * 100) / 100 })
    })

    // Recent transactions
    const recentTransactions = await db.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
      },
    })

    // Recent users
    const recentUsers = await db.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      data: {
        stats: {
          totalUsers,
          activeMembers,
          activeClients,
          revenue: revenueResult._sum.amount || 0,
          activeRouters,
          openTickets,
        },
        monthlyRevenue,
        recentTransactions,
        recentUsers,
      },
    })

  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
