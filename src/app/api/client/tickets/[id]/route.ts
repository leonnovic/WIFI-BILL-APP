import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { id } = await params

    const ticket = await db.ticket.findFirst({
      where: { id, userId },
      include: {
        assignee: { select: { id: true, name: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    })
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

    return NextResponse.json({ data: ticket })
  } catch (error) {
    console.error("Client ticket GET error:", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { id } = await params
    const body = await request.json()

    // Verify this ticket belongs to this client
    const existing = await db.ticket.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

    // Add a response to the ticket
    if (body.message) {
      const response = await db.ticketResponse.create({
        data: {
          ticketId: id,
          userId,
          userName: session.user?.name || "Client",
          message: body.message,
        },
      })
      return NextResponse.json({ data: response }, { status: 201 })
    }

    // Allow client to close their own ticket
    if (body.status === "closed") {
      const ticket = await db.ticket.update({
        where: { id },
        data: { status: "closed" },
      })
      return NextResponse.json({ data: ticket })
    }

    return NextResponse.json({ error: "No action specified" }, { status: 400 })
  } catch (error) {
    console.error("Client ticket POST error:", error)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
