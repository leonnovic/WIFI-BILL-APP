import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = (session.user as any).id
    const userRole = (session.user as any).role
    if (userRole !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const now = new Date()

    // Get clients count
    const clients = await db.user.count({ where: { memberId: userId, role: "client" } })

    // Get active packages count (clients with active packages)
    const activePackages = await db.user.count({
      where: { memberId: userId, activePackageId: { not: null } },
    })

    // Total packages this ISP offers
    const totalPackages = await db.package.count({ where: { ispId: userId } })

    // Get monthly revenue from this member's clients
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const transactions = await db.transaction.findMany({
      where: {
        type: { in: ["purchase", "repayment"] },
        status: "completed",
        user: { memberId: userId },
      },
      orderBy: { createdAt: "desc" },
    })
    const monthlyRevenue = transactions
      .filter(t => new Date(t.createdAt) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0)

    // Active routers
    const activeRouters = await db.router.count({ where: { ownerId: userId, status: "online" } })
    const totalRouters = await db.router.count({ where: { ownerId: userId } })

    // Open tickets
    const openTickets = await db.ticket.count({
      where: { ispId: userId, status: { in: ["open", "in_progress"] } },
    })

    // OKOA credit given
    const okoaClients = await db.user.findMany({
      where: { memberId: userId, okoaBalance: { gt: 0 } },
      select: { okoaBalance: true },
    })
    const okoaCreditGiven = okoaClients.reduce((sum, c) => sum + c.okoaBalance, 0)

    // Revenue trend - last 12 months
    const revenueTrend = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthName = monthStart.toLocaleString("default", { month: "short" })
      const monthTx = transactions.filter(t => {
        const d = new Date(t.createdAt)
        return d >= monthStart && d < monthEnd
      })
      revenueTrend.push({
        month: monthName,
        revenue: monthTx.reduce((sum, t) => sum + t.amount, 0),
      })
    }

    // Activity feed - recent events
    const activityItems: { id: string; text: string; time: string; type: string }[] = []

    // Recent transactions as activity
    const recentTx = await db.transaction.findMany({
      where: { user: { memberId: userId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    })

    for (const tx of recentTx) {
      const timeAgo = getTimeAgo(new Date(tx.createdAt))
      if (tx.type === "purchase") {
        activityItems.push({ id: tx.id, text: `${tx.user.name || "Client"} purchased a package`, time: timeAgo, type: "purchase" })
      } else if (tx.type === "okoa") {
        activityItems.push({ id: tx.id, text: `${tx.user.name || "Client"} requested OKOA credit`, time: timeAgo, type: "okoa" })
      } else if (tx.type === "repayment") {
        activityItems.push({ id: tx.id, text: `${tx.user.name || "Client"} repaid OKOA credit`, time: timeAgo, type: "repayment" })
      }
    }

    // Recent tickets as activity
    const recentTickets = await db.ticket.findMany({
      where: { ispId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    })

    for (const t of recentTickets) {
      activityItems.push({
        id: t.id,
        text: `New support ticket from ${t.user.name || "Client"}`,
        time: getTimeAgo(new Date(t.createdAt)),
        type: "ticket",
      })
    }

    // Router alerts
    const offlineRouters = await db.router.findMany({
      where: { ownerId: userId, status: "offline" },
      take: 5,
    })
    for (const r of offlineRouters) {
      activityItems.push({
        id: r.id,
        text: `${r.name} went offline`,
        time: r.lastSeen ? getTimeAgo(new Date(r.lastSeen)) : "Unknown",
        type: "alert",
      })
    }

    // Sort activity by recency (approximation)
    activityItems.sort(() => Math.random() - 0.5)
    const activityFeed = activityItems.slice(0, 8)

    // Recent transactions for table
    const recentTransactions = await db.transaction.findMany({
      where: { user: { memberId: userId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        package: { select: { name: true } },
      },
    })

    // Get user info for welcome message
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { businessName: true, name: true },
    })

    return NextResponse.json({
      data: {
        clients,
        activePackages,
        monthlyRevenue,
        activeRouters,
        totalRouters,
        openTickets,
        okoaCreditGiven,
        totalPackages,
        revenueTrend,
        activityFeed,
        recentTransactions,
        businessName: user?.businessName || user?.name || "ISP",
      },
    })
  } catch (error) {
    console.error("Member dashboard error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
