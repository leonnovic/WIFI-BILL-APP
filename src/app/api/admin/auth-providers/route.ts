import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const authKeys = [
      "auth_google",
      "auth_apple",
      "auth_phone_otp",
      "auth_email_verification",
    ]

    const settings = await db.systemSetting.findMany({
      where: { key: { in: authKeys } },
    })

    const settingsMap: Record<string, string> = {}
    settings.forEach(s => { settingsMap[s.key] = s.value })

    // Provide defaults for missing keys
    const defaults: Record<string, string> = {
      auth_google: JSON.stringify({ enabled: false, clientId: "", clientSecret: "" }),
      auth_apple: JSON.stringify({ enabled: false }),
      auth_phone_otp: JSON.stringify({ enabled: true, length: 6, expiry: "5m" }),
      auth_email_verification: JSON.stringify({ enabled: true, requireOnSignup: false }),
    }

    for (const key of authKeys) {
      if (!settingsMap[key]) {
        settingsMap[key] = defaults[key] || "{}"
      }
    }

    return NextResponse.json({ data: settingsMap })
  } catch (error) {
    console.error("Admin auth-providers GET error:", error)
    return NextResponse.json({ error: "Failed to fetch auth providers" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const providers = body.providers || body
    const entries = Object.entries(providers)

    const upserts = entries.map(([key, value]) =>
      db.systemSetting.upsert({
        where: { key },
        update: { value: typeof value === "string" ? value : JSON.stringify(value) },
        create: { key, value: typeof value === "string" ? value : JSON.stringify(value) },
      })
    )
    await Promise.all(upserts)

    return NextResponse.json({ data: { success: true, updated: entries.length } })
  } catch (error) {
    console.error("Admin auth-providers PUT error:", error)
    return NextResponse.json({ error: "Failed to update auth providers" }, { status: 500 })
  }
}
