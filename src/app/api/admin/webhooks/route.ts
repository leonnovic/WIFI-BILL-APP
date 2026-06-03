import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const webhooks = await db.webhook.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ data: webhooks })

  } catch (error) {
    console.error("Admin webhooks list error:", error)
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
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminId = (session.user as any).id
    const body = await request.json()
    const { name, url, events, secret, isActive } = body

    if (!name || !url || !events) {
      return NextResponse.json({ error: "Name, URL, and events are required" }, { status: 400 })
    }

    const webhook = await db.webhook.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        events: Array.isArray(events) ? JSON.stringify(events) : events,
        secret: secret || uuidv4(),
        isActive: isActive !== false,
        userId: adminId,
      },
    })

    return NextResponse.json({ data: webhook, message: "Webhook created successfully" }, { status: 201 })

  } catch (error) {
    console.error("Admin create webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
