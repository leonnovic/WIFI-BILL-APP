import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getNotificationService } from "@/lib/notifications"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    // Ensure ticket belongs to one of this member's clients
    const ticket = await db.ticket.findFirst({
      where: { id, user: { memberId } },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        assignee: { select: { id: true, name: true, email: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ data: ticket })

  } catch (error) {
    console.error("Member get ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const memberName = session.user.name || "ISP Support"
    const { id } = await params
    const body = await request.json()
    const { status, priority, assignedTo, response } = body

    // Ensure ticket belongs to one of this member's clients
    const existing = await db.ticket.findFirst({
      where: { id, user: { memberId } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null

    // If a response is provided, add it
    if (response) {
      await db.ticketResponse.create({
        data: {
          ticketId: id,
          userId: memberId,
          userName: memberName,
          message: response.trim(),
        },
      })
    }

    const ticket = await db.ticket.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    })

    // Notify the client
    if (status && status !== existing.status) {
      getNotificationService().notify({
        userId: existing.userId,
        title: "Ticket Updated",
        message: `Your ticket "${existing.subject}" has been updated to: ${status}`,
        type: "info",
      }).catch(err => console.error("Notification error:", err))
    }

    return NextResponse.json({ data: ticket, message: "Ticket updated successfully" })

  } catch (error) {
    console.error("Member update ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
