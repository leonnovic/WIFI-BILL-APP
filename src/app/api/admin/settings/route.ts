import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const settings = await db.systemSetting.findMany({
      orderBy: { key: "asc" },
    })

    // Convert to key-value object for easy access
    const settingsMap: Record<string, string> = {}
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
    }

    return NextResponse.json({ data: settingsMap })

  } catch (error) {
    console.error("Admin settings get error:", error)
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
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    // Body should be a key-value object of settings to update
    // e.g. { "site_name": "ISPLedger", "default_currency": "KES" }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Settings object is required" }, { status: 400 })
    }

    // Upsert each setting
    const updates = Object.entries(body).map(([key, value]) =>
      db.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )

    await Promise.all(updates)

    // Return updated settings
    const settings = await db.systemSetting.findMany({ orderBy: { key: "asc" } })
    const settingsMap: Record<string, string> = {}
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
    }

    return NextResponse.json({ data: settingsMap, message: "Settings updated successfully" })

  } catch (error) {
    console.error("Admin settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
