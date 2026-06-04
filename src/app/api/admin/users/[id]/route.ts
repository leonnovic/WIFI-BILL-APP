import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      include: {
        clients: { select: { id: true, name: true, email: true, status: true, okoaBalance: true } },
        activePackage: { select: { id: true, name: true, price: true, speed: true } },
        _count: { select: { transactions: true, routers: true, tickets: true } },
      },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Remove password from response
    const { password, ...safeUser } = user
    return NextResponse.json({ data: safeUser })
  } catch (error) {
    console.error("Admin user GET error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await request.json()

    // Verify user exists
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Build safe update data
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.email !== undefined) data.email = body.email
    if (body.role !== undefined) data.role = body.role.toLowerCase()
    if (body.status !== undefined) data.status = body.status.toLowerCase()
    if (body.phone !== undefined) data.phone = body.phone
    if (body.businessName !== undefined) data.businessName = body.businessName
    if (body.businessRegNo !== undefined) data.businessRegNo = body.businessRegNo
    if (body.businessAddress !== undefined) data.businessAddress = body.businessAddress
    if (body.kraPin !== undefined) data.kraPin = body.kraPin
    if (body.okoaBalance !== undefined) data.okoaBalance = parseFloat(body.okoaBalance)
    if (body.okoaLimit !== undefined) data.okoaLimit = parseFloat(body.okoaLimit)
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.memberId !== undefined) data.memberId = body.memberId

    // Password update
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 12)
    }

    const user = await db.user.update({ where: { id }, data })
    const { password, ...safeUser } = user
    return NextResponse.json({ data: safeUser })
  } catch (error) {
    console.error("Admin user PUT error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params

    // Prevent deleting self
    if (id === (session.user as any).id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 })

    await db.user.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("Admin user DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
