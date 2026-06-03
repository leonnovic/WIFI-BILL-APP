import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where: { senderId: memberId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          // Recipient info if available
        },
      }),
      db.message.count({ where: { senderId: memberId } }),
    ])

    return NextResponse.json({
      data: messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error("Member messages error:", error)
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
    if (userRole !== "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const memberId = (session.user as any).id
    const body = await request.json()
    const { recipientId, subject, content, type } = body

    if (!subject || !content) {
      return NextResponse.json({ error: "Subject and content are required" }, { status: 400 })
    }

    // If recipient specified, ensure they are a client of this member
    if (recipientId) {
      const client = await db.user.findFirst({
        where: { id: recipientId, memberId, role: "client" },
      })
      if (!client) {
        return NextResponse.json({ error: "Recipient not found or not your client" }, { status: 404 })
      }
    }

    const message = await db.message.create({
      data: {
        senderId: memberId,
        recipientId: recipientId || null,
        recipient: recipientId ? undefined : "all_clients",
        subject: subject.trim(),
        content: content.trim(),
        type: type || "in_app",
        status: "sent",
        sentAt: new Date(),
      },
    })

    return NextResponse.json({ data: message, message: "Message sent successfully" }, { status: 201 })

  } catch (error) {
    console.error("Member send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
