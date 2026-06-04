import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = {}
    if (type) where.type = type.toLowerCase()
    if (status) where.status = status.toLowerCase()

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, email: true } } },
      }),
      db.message.count({ where }),
    ])

    return NextResponse.json({ data: messages, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("Admin messages GET error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const body = await request.json()

    if (!body.subject || !body.content) {
      return NextResponse.json({ error: "Subject and content are required" }, { status: 400 })
    }

    const message = await db.message.create({
      data: {
        senderId: userId,
        recipientId: body.recipientId || null,
        recipient: body.recipient || null,
        subject: body.subject,
        content: body.content,
        type: (body.type || "email").toLowerCase(),
        status: "sent",
        sentAt: new Date(),
      },
    })

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error) {
    console.error("Admin messages POST error:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
