import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "member") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await db.user.findUnique({ where: { id: (session.user as any).id }, select: { id: true, name: true, email: true, phone: true, businessName: true, kraPin: true } })
    const settings = await db.systemSetting.findMany()
    return NextResponse.json({ user, settings: Object.fromEntries(settings.map(s => [s.key, s.value])) })
  } catch { return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 }) }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "member") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = (session.user as any).id
    const body = await request.json()

    // Password change
    if (body.currentPassword && body.newPassword) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user?.password) return NextResponse.json({ error: "No password set" }, { status: 400 })
      const valid = await bcrypt.compare(body.currentPassword, user.password)
      if (!valid) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 })
      const hashed = await bcrypt.hash(body.newPassword, 10)
      await db.user.update({ where: { id: userId }, data: { password: hashed } })
      return NextResponse.json({ success: true })
    }

    // Profile update
    if (body.name || body.phone || body.businessName || body.kraPin) {
      await db.user.update({
        where: { id: userId },
        data: { name: body.name, phone: body.phone, businessName: body.businessName, kraPin: body.kraPin },
      })
    }

    if (body.settings) {
      for (const [key, value] of Object.entries(body.settings)) {
        await db.systemSetting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
      }
    }

    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: "Failed to update settings" }, { status: 500 }) }
}
