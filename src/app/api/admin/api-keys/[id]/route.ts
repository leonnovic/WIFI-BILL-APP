import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

    const existing = await db.apiKey.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    await db.apiKey.delete({ where: { id } })

    return NextResponse.json({ message: "API key deleted successfully" })

  } catch (error) {
    console.error("Admin delete api-key error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const { name, permissions, isActive, expiresAt } = body

    const existing = await db.apiKey.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (permissions !== undefined) updateData.permissions = permissions
    if (isActive !== undefined) updateData.isActive = isActive
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    const apiKey = await db.apiKey.update({
      where: { id },
      data: updateData,
    })

    // Mask the key
    const maskedKey = {
      ...apiKey,
      key: apiKey.key.slice(0, 8) + "..." + apiKey.key.slice(-4),
    }

    return NextResponse.json({ data: maskedKey, message: "API key updated successfully" })

  } catch (error) {
    console.error("Admin update api-key error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
