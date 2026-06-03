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
    if (userRole !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [tickets, total] = await Promise.all([
      db.ticket.findMany({
        where: { userId: clientId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      db.ticket.count({ where: { userId: clientId } }),
    ])

    return NextResponse.json({
      data: tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error("Client tickets list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
    const body = await request.json()
    const { subject, description, priority, category } = body

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 })
    }

    // Get client's ISP member ID
    const client = await db.user.findUnique({
      where: { id: clientId },
      select: { memberId: true },
    })

    const ticket = await db.ticket.create({
      data: {
        subject: subject.trim(),
        description: description.trim(),
        userId: clientId,
        priority: priority || "medium",
        category: category || "technical",
        ispId: client?.memberId || null,
      },
    })

    return NextResponse.json({ data: ticket, message: "Ticket created successfully" }, { status: 201 })

  } catch (error) {
    console.error("Client create ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
