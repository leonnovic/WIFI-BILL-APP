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
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        assignee: { select: { id: true, name: true, email: true } },
        responses: {
          orderBy: { createdAt: "asc" },
          include: {
            // We can't include full user relation here since TicketResponse doesn't have it
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ data: ticket })

  } catch (error) {
    console.error("Admin get ticket error:", error)
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
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, priority, assignedTo } = body

    const existing = await db.ticket.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null

    const ticket = await db.ticket.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    })

    // Send notification to the ticket creator about status change
    if (status && status !== existing.status) {
      getNotificationService().notify({
        userId: existing.userId,
        title: "Ticket Updated",
        message: `Your ticket "${existing.subject}" status changed to ${status}`,
        type: "info",
      }).catch(err => console.error("Notification error:", err))
    }

    return NextResponse.json({ data: ticket, message: "Ticket updated successfully" })

  } catch (error) {
    console.error("Admin update ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
