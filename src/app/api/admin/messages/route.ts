import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEmailService } from "@/lib/email"
import { getSMSAPI } from "@/lib/sms"

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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const type = searchParams.get("type") || ""
    const status = searchParams.get("status") || ""
    const skip = (page - 1) * limit

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
      }),
      db.message.count({ where }),
    ])

    return NextResponse.json({
      data: messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error("Admin messages list error:", error)
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

    const senderId = (session.user as any).id
    const body = await request.json()
    const { recipientId, recipient, subject, content, type } = body

    if (!subject || !content) {
      return NextResponse.json({ error: "Subject and content are required" }, { status: 400 })
    }

    const messageType = type || "in_app" // email, sms, in_app

    const message = await db.message.create({
      data: {
        senderId,
        recipientId: recipientId || null,
        recipient: recipient || null,
        subject: subject.trim(),
        content: content.trim(),
        type: messageType,
        status: "pending",
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
    })

    // Actually send the message based on type
    if (messageType === "email" || messageType === "all") {
      // Find the recipient's email
      if (recipientId) {
        const recipientUser = await db.user.findUnique({ where: { id: recipientId } })
        if (recipientUser?.email) {
          getEmailService().sendEmail({
            to: recipientUser.email,
            subject: subject.trim(),
            html: `<div style="font-family: sans-serif; padding: 20px;"><p>${content}</p></div>`,
          }).then(() => {
            db.message.update({ where: { id: message.id }, data: { status: "sent", sentAt: new Date() } })
          }).catch(err => {
            console.error("Email send error:", err)
            db.message.update({ where: { id: message.id }, data: { status: "failed" } })
          })
        }
      }
    }

    if (messageType === "sms" || messageType === "all") {
      if (recipientId) {
        const recipientUser = await db.user.findUnique({ where: { id: recipientId } })
        if (recipientUser?.phone) {
          getSMSAPI().sendSMS({
            to: recipientUser.phone,
            message: `${subject}: ${content}`,
          }).then(() => {
            db.message.update({ where: { id: message.id }, data: { status: "sent", sentAt: new Date() } })
          }).catch(err => {
            console.error("SMS send error:", err)
            db.message.update({ where: { id: message.id }, data: { status: "failed" } })
          })
        }
      }
    }

    // For in_app type, mark as delivered immediately
    if (messageType === "in_app") {
      await db.message.update({ where: { id: message.id }, data: { status: "delivered", sentAt: new Date() } })
    }

    return NextResponse.json({ data: message, message: "Message sent successfully" }, { status: 201 })

  } catch (error) {
    console.error("Admin send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
