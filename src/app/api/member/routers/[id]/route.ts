import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { testRouterConnection } from "@/lib/mikrotik"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    const router = await db.router.findFirst({ where: { id, ownerId: memberId } })
    if (!router) {
      return NextResponse.json({ error: "Router not found" }, { status: 404 })
    }

    return NextResponse.json({ data: router })

  } catch (error) {
    console.error("Member get router error:", error)
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
    if (userRole !== "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const memberId = (session.user as any).id
    const { id } = await params
    const body = await request.json()

    const existing = await db.router.findFirst({ where: { id, ownerId: memberId } })
    if (!existing) {
      return NextResponse.json({ error: "Router not found" }, { status: 404 })
    }

    const { name, ipAddress, username, password, model, location, isActive } = body
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress.trim()
    if (username !== undefined) updateData.username = username.trim()
    if (password !== undefined) updateData.password = password
    if (model !== undefined) updateData.model = model?.trim() || null
    if (location !== undefined) updateData.location = location?.trim() || null
    if (isActive !== undefined) updateData.isActive = isActive

    // Test connection if IP or credentials changed
    if (ipAddress || username || password) {
      try {
        const result = await testRouterConnection({
          host: updateData.ipAddress || existing.ipAddress,
          port: 8728,
          username: updateData.username || existing.username,
          password: updateData.password !== undefined ? updateData.password : existing.password,
          timeout: 5000,
        })
        updateData.status = result.success ? "online" : "offline"
        if (result.success) updateData.lastSeen = new Date()
      } catch {
        updateData.status = "offline"
      }
    }

    const router = await db.router.update({ where: { id }, data: updateData })

    return NextResponse.json({ data: router, message: "Router updated successfully" })

  } catch (error) {
    console.error("Member update router error:", error)
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
    if (userRole !== "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const memberId = (session.user as any).id
    const { id } = await params

    const existing = await db.router.findFirst({ where: { id, ownerId: memberId } })
    if (!existing) {
      return NextResponse.json({ error: "Router not found" }, { status: 404 })
    }

    await db.router.delete({ where: { id } })

    return NextResponse.json({ message: "Router deleted successfully" })

  } catch (error) {
    console.error("Member delete router error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
