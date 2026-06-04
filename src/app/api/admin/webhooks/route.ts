import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const webhooks = await db.webhook.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ data: webhooks })
  } catch (error) {
    console.error("Admin webhooks GET error:", error)
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const body = await request.json()

    if (!body.name || !body.url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 })
    }

    // events should be a JSON string
    const eventsValue = Array.isArray(body.events)
      ? JSON.stringify(body.events)
      : body.events || "[]"

    const webhook = await db.webhook.create({
      data: {
        name: body.name,
        url: body.url,
        events: eventsValue,
        secret: body.secret || null,
        isActive: body.isActive !== false,
        userId: body.userId || userId,
      },
    })

    return NextResponse.json({ data: webhook }, { status: 201 })
  } catch (error) {
    console.error("Admin webhooks POST error:", error)
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}
