import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const messages = await db.message.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: messages })
  } catch (error) {
    console.error("Member messages GET error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const body = await request.json()

    if (!body.subject || !body.content) {
      return NextResponse.json({ error: "Subject and content are required" }, { status: 400 })
    }

    // If sending to a specific client, verify they belong to this member
    if (body.recipientId) {
      const client = await db.user.findFirst({
        where: { id: body.recipientId, memberId: userId, role: "client" },
      })
      if (!client) return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    const message = await db.message.create({
      data: {
        senderId: userId,
        recipientId: body.recipientId || null,
        recipient: body.recipient || "all",
        subject: body.subject,
        content: body.content,
        type: (body.type || "sms").toLowerCase(),
        status: "sent",
        sentAt: new Date(),
      },
    })

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error) {
    console.error("Member messages POST error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
