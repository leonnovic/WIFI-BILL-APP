import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    })
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

    return NextResponse.json({ data: ticket })
  } catch (error) {
    console.error("Admin ticket GET error:", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await request.json()

    const existing = await db.ticket.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

    const data: any = {}
    if (body.subject !== undefined) data.subject = body.subject
    if (body.description !== undefined) data.description = body.description
    if (body.status !== undefined) data.status = body.status.toLowerCase()
    if (body.priority !== undefined) data.priority = body.priority.toLowerCase()
    if (body.category !== undefined) data.category = body.category
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo
    if (body.ispId !== undefined) data.ispId = body.ispId

    // Handle adding a response
    if (body.response) {
      await db.ticketResponse.create({
        data: {
          ticketId: id,
          userId: (session.user as any).id,
          userName: session.user?.name || "Admin",
          message: body.response,
        },
      })
    }

    const ticket = await db.ticket.update({ where: { id }, data })
    return NextResponse.json({ data: ticket })
  } catch (error) {
    console.error("Admin ticket PUT error:", error)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
