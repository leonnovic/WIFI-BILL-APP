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
    if (userRole !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = (session.user as any).id
    const { id } = await params

    // Ensure ticket belongs to this client
    const ticket = await db.ticket.findFirst({
      where: { id, userId: clientId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ data: ticket })

  } catch (error) {
    console.error("Client get ticket error:", error)
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
    if (userRole !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = (session.user as any).id
    const clientName = session.user.name || "Client"
    const { id } = await params
    const body = await request.json()
    const { response } = body

    if (!response) {
      return NextResponse.json({ error: "Response message is required" }, { status: 400 })
    }

    // Ensure ticket belongs to this client
    const ticket = await db.ticket.findFirst({
      where: { id, userId: clientId },
    })
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Add response
    const ticketResponse = await db.ticketResponse.create({
      data: {
        ticketId: id,
        userId: clientId,
        userName: clientName,
        message: response.trim(),
      },
    })

    // If ticket was closed, reopen it
    if (ticket.status === "resolved" || ticket.status === "closed") {
      await db.ticket.update({
        where: { id },
        data: { status: "open" },
      })
    }

    // Notify ISP member if assigned
    if (ticket.assignedTo) {
      getNotificationService().notify({
        userId: ticket.assignedTo,
        title: "Ticket Response",
        message: `Client responded to ticket "${ticket.subject}"`,
        type: "info",
      }).catch(err => console.error("Notification error:", err))
    } else if (ticket.ispId) {
      // Notify the ISP
      getNotificationService().notify({
        userId: ticket.ispId,
        title: "Ticket Response",
        message: `Client responded to ticket "${ticket.subject}"`,
        type: "info",
      }).catch(err => console.error("Notification error:", err))
    }

    return NextResponse.json({ data: ticketResponse, message: "Response added successfully" })

  } catch (error) {
    console.error("Client ticket response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
