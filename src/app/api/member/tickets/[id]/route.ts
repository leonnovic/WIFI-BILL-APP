import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { id } = await params

    const ticket = await db.ticket.findFirst({
      where: { id, ispId: userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    })
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

    return NextResponse.json({ data: ticket })
  } catch (error) {
    console.error("Member ticket GET error:", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { id } = await params
    const body = await request.json()

    // Verify this ticket belongs to this member's ISP
    const existing = await db.ticket.findFirst({ where: { id, ispId: userId } })
    if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

    // Handle adding a response
    if (body.response) {
      await db.ticketResponse.create({
        data: {
          ticketId: id,
          userId,
          userName: session.user?.name || "ISP Support",
          message: body.response,
        },
      })
    }

    // Update ticket fields
    const data: any = {}
    if (body.status !== undefined) data.status = body.status.toLowerCase()
    if (body.priority !== undefined) data.priority = body.priority.toLowerCase()
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo
    if (body.category !== undefined) data.category = body.category

    const ticket = await db.ticket.update({ where: { id }, data })
    return NextResponse.json({ data: ticket })
  } catch (error) {
    console.error("Member ticket PUT error:", error)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
