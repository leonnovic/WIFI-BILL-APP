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
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const router = await db.router.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, businessName: true } },
      },
    })

    if (!router) {
      return NextResponse.json({ error: "Router not found" }, { status: 404 })
    }

    return NextResponse.json({ data: router })

  } catch (error) {
    console.error("Admin get router error:", error)
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
    const { name, ipAddress, username, password, model, location, status, isActive, ownerId } = body

    const existing = await db.router.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Router not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress.trim()
    if (username !== undefined) updateData.username = username.trim()
    if (password !== undefined) updateData.password = password
    if (model !== undefined) updateData.model = model?.trim() || null
    if (location !== undefined) updateData.location = location?.trim() || null
    if (status !== undefined) updateData.status = status
    if (isActive !== undefined) updateData.isActive = isActive
    if (ownerId !== undefined) updateData.ownerId = ownerId

    // If IP or credentials changed, test connection
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
        if (result.success) {
          updateData.lastSeen = new Date()
        }
      } catch {
        updateData.status = "offline"
      }
    }

    const router = await db.router.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, businessName: true } },
      },
    })

    return NextResponse.json({ data: router, message: "Router updated successfully" })

  } catch (error) {
    console.error("Admin update router error:", error)
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

    const existing = await db.router.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Router not found" }, { status: 404 })
    }

    await db.router.delete({ where: { id } })

    return NextResponse.json({ message: "Router deleted successfully" })

  } catch (error) {
    console.error("Admin delete router error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
