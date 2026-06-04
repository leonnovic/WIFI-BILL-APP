import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true,
        status: true, okoaBalance: true, okoaLimit: true,
        connectionStatus: true, avatar: true, createdAt: true,
        member: { select: { id: true, name: true, businessName: true, phone: true } },
      },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error("Client profile GET error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const body = await request.json()

    // Handle password change
    if (body.currentPassword && body.newPassword) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user?.password) return NextResponse.json({ error: "No password set" }, { status: 400 })

      const valid = await bcrypt.compare(body.currentPassword, user.password)
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })

      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
      }

      const hashed = await bcrypt.hash(body.newPassword, 12)
      await db.user.update({ where: { id: userId }, data: { password: hashed } })

      return NextResponse.json({ data: { success: true, message: "Password updated" } })
    }

    // Handle profile update
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.phone !== undefined) data.phone = body.phone
    if (body.avatar !== undefined) data.avatar = body.avatar

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, name: true, email: true, phone: true,
        status: true, okoaBalance: true, okoaLimit: true,
        connectionStatus: true, avatar: true,
      },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error("Client profile PUT error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
