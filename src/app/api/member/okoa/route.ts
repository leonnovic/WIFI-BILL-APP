import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // OKOA transactions for this member's clients
    const where: any = {
      type: { in: ["okoa", "repayment"] },
      user: { memberId },
    }

    const [okoaTransactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, okoaBalance: true, okoaLimit: true, okoaUsed: true } },
        },
      }),
      db.transaction.count({ where }),
    ])

    // OKOA summary stats
    const totalOkoaDebt = await db.user.aggregate({
      where: { memberId, role: "client" },
      _sum: { okoaBalance: true, okoaUsed: true },
    })

    return NextResponse.json({
      data: okoaTransactions,
      stats: {
        totalOkoaDebt: totalOkoaDebt._sum.okoaBalance || 0,
        totalOkoaUsed: totalOkoaDebt._sum.okoaUsed || 0,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error("Member okoa list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
