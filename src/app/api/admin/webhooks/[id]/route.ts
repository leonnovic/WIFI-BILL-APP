import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
    const { name, url, events, secret, isActive } = body

    const existing = await db.webhook.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (url !== undefined) updateData.url = url.trim()
    if (events !== undefined) updateData.events = Array.isArray(events) ? JSON.stringify(events) : events
    if (secret !== undefined) updateData.secret = secret
    if (isActive !== undefined) updateData.isActive = isActive

    const webhook = await db.webhook.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: webhook, message: "Webhook updated successfully" })

  } catch (error) {
    console.error("Admin update webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
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

    const existing = await db.webhook.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    await db.webhook.delete({ where: { id } })

    return NextResponse.json({ message: "Webhook deleted successfully" })

  } catch (error) {
    console.error("Admin delete webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
