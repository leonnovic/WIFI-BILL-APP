import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        okoaBalance: true,
        okoaLimit: true,
        okoaUsed: true,
        memberId: true,
      },
    })

    const availableCredit = (user?.okoaLimit || 0) - (user?.okoaBalance || 0)

    // Get OKOA/repayment history
    const history = await db.transaction.findMany({
      where: { userId, type: { in: ["okoa", "repayment"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({
      data: {
        okoaBalance: user?.okoaBalance || 0,
        okoaLimit: user?.okoaLimit || 0,
        okoaUsed: user?.okoaUsed || 0,
        availableCredit,
        history,
      },
    })
  } catch (error) {
    console.error("Client okoa GET error:", error)
    return NextResponse.json({ error: "Failed to fetch OKOA data" }, { status: 500 })
  }
}
