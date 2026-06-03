import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

    // Ensure the client belongs to this member
    const client = await db.user.findFirst({
      where: { id, memberId, role: "client" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        status: true,
        okoaBalance: true,
        okoaLimit: true,
        okoaUsed: true,
        connectionStatus: true,
        packageExpiry: true,
        dataUsed: true,
        dataLimit: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        activePackage: { select: { id: true, name: true, speed: true, price: true, duration: true } },
        _count: { select: { transactions: true, tickets: true } },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ data: client })

  } catch (error) {
    console.error("Member get client error:", error)
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
    const { name, phone, isActive, status, okoaLimit } = body

    // Ensure the client belongs to this member
    const existing = await db.user.findFirst({ where: { id, memberId, role: "client" } })
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (isActive !== undefined) updateData.isActive = isActive
    if (status !== undefined) updateData.status = status
    if (okoaLimit !== undefined) updateData.okoaLimit = parseFloat(okoaLimit)

    const client = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        status: true,
        okoaLimit: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: client, message: "Client updated successfully" })

  } catch (error) {
    console.error("Member update client error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
