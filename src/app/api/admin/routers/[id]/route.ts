import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const router = await db.router.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, businessName: true } } },
    })
    if (!router) return NextResponse.json({ error: "Router not found" }, { status: 404 })

    return NextResponse.json({ data: router })
  } catch (error) {
    console.error("Admin router GET error:", error)
    return NextResponse.json({ error: "Failed to fetch router" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await request.json()

    const existing = await db.router.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Router not found" }, { status: 404 })

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.ipAddress !== undefined) data.ipAddress = body.ipAddress
    if (body.username !== undefined) data.username = body.username
    if (body.password !== undefined) data.password = body.password
    if (body.model !== undefined) data.model = body.model
    if (body.location !== undefined) data.location = body.location
    if (body.status !== undefined) {
      data.status = body.status.toLowerCase()
      if (body.status === "online") data.lastSeen = new Date()
    }
    if (body.connectedClients !== undefined) data.connectedClients = parseInt(body.connectedClients)
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.ownerId !== undefined) data.ownerId = body.ownerId

    const router = await db.router.update({ where: { id }, data })
    return NextResponse.json({ data: router })
  } catch (error) {
    console.error("Admin router PUT error:", error)
    return NextResponse.json({ error: "Failed to update router" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const existing = await db.router.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Router not found" }, { status: 404 })

    await db.router.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("Admin router DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete router" }, { status: 500 })
  }
}
