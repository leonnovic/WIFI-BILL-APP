import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const tickets = await db.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        assignee: { select: { id: true, name: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json({ data: tickets })
  } catch (error) {
    console.error("Client tickets GET error:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const body = await request.json()

    if (!body.subject || !body.description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 })
    }

    // Find the client's ISP
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { memberId: true },
    })

    const ticket = await db.ticket.create({
      data: {
        subject: body.subject,
        description: body.description,
        priority: (body.priority || "medium").toLowerCase(),
        category: body.category || null,
        status: "open",
        userId,
        ispId: user?.memberId || null,
      },
    })

    return NextResponse.json({ data: ticket }, { status: 201 })
  } catch (error) {
    console.error("Client tickets POST error:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}
