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
    if (userRole !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = (session.user as any).id

    // Get client info with active package
    const client = await db.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        okoaBalance: true,
        okoaLimit: true,
        okoaUsed: true,
        connectionStatus: true,
        packageExpiry: true,
        dataUsed: true,
        dataLimit: true,
        activePackage: {
          select: { id: true, name: true, speed: true, price: true, duration: true, durationStr: true },
        },
        member: {
          select: { id: true, name: true, businessName: true, phone: true },
        },
      },
    })

    // Recent transactions
    const recentTransactions = await db.transaction.findMany({
      where: { userId: clientId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        package: { select: { id: true, name: true, speed: true } },
      },
    })

    // Active tickets count
    const openTickets = await db.ticket.count({
      where: { userId: clientId, status: { in: ["open", "in_progress"] } },
    })

    return NextResponse.json({
      data: {
        client,
        recentTransactions,
        openTickets,
      },
    })

  } catch (error) {
    console.error("Client dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
