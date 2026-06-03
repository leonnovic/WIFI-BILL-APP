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
    const status = searchParams.get("status") || ""
    const skip = (page - 1) * limit

    // Tickets from this member's clients
    const where: any = {
      user: { memberId },
    }
    if (status) where.status = status

    const [tickets, total] = await Promise.all([
      db.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      db.ticket.count({ where }),
    ])

    return NextResponse.json({
      data: tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error("Member tickets list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
