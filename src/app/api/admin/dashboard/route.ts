import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userRole = (session.user as any).role
    if (userRole !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalUsers,
      activeMembers,
      activeClients,
      transactionsThisMonth,
      activeRouters,
      openTickets,
      recentTransactions,
      recentUsers,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "member", status: "active" } }),
      db.user.count({ where: { role: "client", status: "active" } }),
      db.transaction.findMany({
        where: { createdAt: { gte: startOfMonth }, status: "completed" },
        select: { amount: true },
      }),
      db.router.count({ where: { status: "online" } }),
      db.ticket.count({ where: { status: { in: ["open", "in_progress"] } } }),
      db.transaction.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } }, package: { select: { name: true } } },
      }),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ])

    const revenue = transactionsThisMonth.reduce((sum, t) => sum + t.amount, 0)

    // Monthly revenue for last 6 months
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthTx = await db.transaction.findMany({
        where: { createdAt: { gte: monthStart, lt: monthEnd }, status: "completed" },
        select: { amount: true },
      })
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        revenue: monthTx.reduce((s, t) => s + t.amount, 0),
      })
    }

    return NextResponse.json({
      stats: { totalUsers, activeMembers, activeClients, revenue, activeRouters, openTickets },
      monthlyRevenue,
      recentTransactions,
      recentUsers,
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
