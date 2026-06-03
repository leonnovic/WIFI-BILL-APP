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

    // Get client OKOA info
    const client = await db.user.findUnique({
      where: { id: clientId },
      select: {
        okoaBalance: true,
        okoaLimit: true,
        okoaUsed: true,
        name: true,
        memberId: true,
      },
    })

    // Get OKOA transaction history
    const okoaTransactions = await db.transaction.findMany({
      where: {
        userId: clientId,
        type: { in: ["okoa", "repayment"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        package: { select: { id: true, name: true } },
      },
    })

    const availableCredit = (client?.okoaLimit || 500) - (client?.okoaBalance || 0)

    return NextResponse.json({
      data: {
        balance: client?.okoaBalance || 0,
        limit: client?.okoaLimit || 500,
        used: client?.okoaUsed || 0,
        availableCredit,
        transactions: okoaTransactions,
      },
    })

  } catch (error) {
    console.error("Client okoa error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
