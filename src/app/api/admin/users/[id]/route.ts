import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-helpers"

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

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        avatar: true,
        businessName: true,
        businessRegNo: true,
        businessAddress: true,
        kraPin: true,
        memberId: true,
        okoaBalance: true,
        okoaLimit: true,
        okoaUsed: true,
        activePackageId: true,
        packageExpiry: true,
        dataUsed: true,
        dataLimit: true,
        connectionStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clients: true,
            transactions: true,
            tickets: true,
            routers: true,
            ispPackages: true,
          },
        },
        activePackage: { select: { id: true, name: true, speed: true, price: true } },
        member: { select: { id: true, name: true, email: true, businessName: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ data: user })

  } catch (error) {
    console.error("Admin get user error:", error)
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
    const { name, email, phone, role, status, isActive, businessName, businessRegNo, businessAddress, kraPin, memberId, password, okoaLimit } = body

    // Verify user exists
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If email is changing, check for duplicates
    if (email && email.toLowerCase() !== existing.email) {
      const duplicate = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
      if (duplicate) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (email !== undefined) updateData.email = email.toLowerCase().trim()
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status
    if (isActive !== undefined) updateData.isActive = isActive
    if (businessName !== undefined) updateData.businessName = businessName?.trim() || null
    if (businessRegNo !== undefined) updateData.businessRegNo = businessRegNo?.trim() || null
    if (businessAddress !== undefined) updateData.businessAddress = businessAddress?.trim() || null
    if (kraPin !== undefined) updateData.kraPin = kraPin?.trim() || null
    if (memberId !== undefined) updateData.memberId = memberId || null
    if (okoaLimit !== undefined) updateData.okoaLimit = parseFloat(okoaLimit)
    if (password) {
      updateData.password = await hashPassword(password)
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        status: true,
        businessName: true,
        okoaLimit: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: user, message: "User updated successfully" })

  } catch (error) {
    console.error("Admin update user error:", error)
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

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Soft delete
    await db.user.update({
      where: { id },
      data: { isActive: false, status: "inactive" },
    })

    return NextResponse.json({ data: null, message: "User deactivated successfully" })

  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
