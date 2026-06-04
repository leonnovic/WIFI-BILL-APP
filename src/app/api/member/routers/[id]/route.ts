import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { id } = await params

    const router = await db.router.findFirst({ where: { id, ownerId: userId } })
    if (!router) return NextResponse.json({ error: "Router not found" }, { status: 404 })

    return NextResponse.json({ data: router })
  } catch (error) {
    console.error("Member router GET error:", error)
    return NextResponse.json({ error: "Failed to fetch router" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existing = await db.router.findFirst({ where: { id, ownerId: userId } })
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

    const router = await db.router.update({ where: { id }, data })
    return NextResponse.json({ data: router })
  } catch (error) {
    console.error("Member router PUT error:", error)
    return NextResponse.json({ error: "Failed to update router" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { id } = await params

    // Verify ownership
    const existing = await db.router.findFirst({ where: { id, ownerId: userId } })
    if (!existing) return NextResponse.json({ error: "Router not found" }, { status: 404 })

    await db.router.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("Member router DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete router" }, { status: 500 })
  }
}
