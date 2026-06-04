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

    const existing = await db.apiKey.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "API key not found" }, { status: 404 })

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.permissions !== undefined) data.permissions = body.permissions
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

    const apiKey = await db.apiKey.update({ where: { id }, data })
    return NextResponse.json({ data: apiKey })
  } catch (error) {
    console.error("Admin api-key PUT error:", error)
    return NextResponse.json({ error: "Failed to update API key" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const existing = await db.apiKey.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "API key not found" }, { status: 404 })

    await db.apiKey.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("Admin api-key DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
  }
}
