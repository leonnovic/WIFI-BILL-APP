import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await request.json()

    const existing = await db.webhook.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Webhook not found" }, { status: 404 })

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.url !== undefined) data.url = body.url
    if (body.events !== undefined) {
      data.events = Array.isArray(body.events)
        ? JSON.stringify(body.events)
        : body.events
    }
    if (body.secret !== undefined) data.secret = body.secret
    if (body.isActive !== undefined) data.isActive = body.isActive

    const webhook = await db.webhook.update({ where: { id }, data })
    return NextResponse.json({ data: webhook })
  } catch (error) {
    console.error("Admin webhook PUT error:", error)
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const existing = await db.webhook.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Webhook not found" }, { status: 404 })

    await db.webhook.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("Admin webhook DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 })
  }
}
