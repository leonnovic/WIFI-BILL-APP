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

    // Ensure this client belongs to this member
    const client = await db.user.findFirst({
      where: { id, memberId: userId, role: "client" },
      include: {
        activePackage: { select: { id: true, name: true, price: true, speed: true } },
        _count: { select: { transactions: true, tickets: true } },
      },
    })
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

    const { password, ...safeClient } = client
    return NextResponse.json({ data: safeClient })
  } catch (error) {
    console.error("Member client GET error:", error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
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
    const existing = await db.user.findFirst({ where: { id, memberId: userId, role: "client" } })
    if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 })

    // Build safe update data
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.phone !== undefined) data.phone = body.phone
    if (body.status !== undefined) data.status = body.status.toLowerCase()
    if (body.okoaLimit !== undefined) data.okoaLimit = parseFloat(body.okoaLimit)
    if (body.okoaBalance !== undefined) data.okoaBalance = parseFloat(body.okoaBalance)
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.connectionStatus !== undefined) data.connectionStatus = body.connectionStatus

    const client = await db.user.update({ where: { id }, data })
    const { password, ...safeClient } = client
    return NextResponse.json({ data: safeClient })
  } catch (error) {
    console.error("Member client PUT error:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}
