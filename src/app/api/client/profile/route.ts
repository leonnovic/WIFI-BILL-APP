import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-helpers"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = (session.user as any).id

    const profile = await db.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        connectionStatus: true,
        okoaBalance: true,
        okoaLimit: true,
        okoaUsed: true,
        packageExpiry: true,
        dataUsed: true,
        dataLimit: true,
        createdAt: true,
        activePackage: {
          select: { id: true, name: true, speed: true, price: true, duration: true },
        },
        member: {
          select: { id: true, name: true, businessName: true, phone: true, email: true },
        },
      },
    })

    return NextResponse.json({ data: profile })

  } catch (error) {
    console.error("Client profile get error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = (session.user as any).id
    const body = await request.json()
    const { name, phone, currentPassword, newPassword } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone?.trim() || null

    // Handle password change
    if (currentPassword && newPassword) {
      const user = await db.user.findUnique({ where: { id: clientId } })
      if (!user?.password) {
        return NextResponse.json({ error: "Cannot change password for OAuth accounts" }, { status: 400 })
      }

      const bcrypt = await import("bcryptjs")
      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
      }

      updateData.password = await hashPassword(newPassword)
    }

    const profile = await db.user.update({
      where: { id: clientId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        phoneVerified: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: profile, message: "Profile updated successfully" })

  } catch (error) {
    console.error("Client profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
