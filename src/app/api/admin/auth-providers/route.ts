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

    // Get auth provider configs from SystemSetting
    const authSettings = await db.systemSetting.findMany({
      where: {
        key: { startsWith: "auth_" },
      },
      orderBy: { key: "asc" },
    })

    // Convert to structured object
    const providers: Record<string, Record<string, string>> = {}
    for (const setting of authSettings) {
      // Key format: auth_providerName_field e.g. auth_google_clientId
      const parts = setting.key.split("_")
      if (parts.length >= 3) {
        const provider = parts[1] // e.g. "google", "apple"
        const field = parts.slice(2).join("_") // e.g. "clientId", "clientSecret"
        if (!providers[provider]) providers[provider] = {}
        providers[provider][field] = setting.value
      }
    }

    return NextResponse.json({ data: providers })

  } catch (error) {
    console.error("Admin auth-providers get error:", error)
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
    // Body should be: { provider: "google", fields: { clientId: "...", clientSecret: "...", enabled: "true" } }

    const { provider, fields } = body
    if (!provider || !fields) {
      return NextResponse.json({ error: "Provider and fields are required" }, { status: 400 })
    }

    // Upsert each field
    const updates = Object.entries(fields).map(([field, value]) => {
      const key = `auth_${provider}_${field}`
      return db.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    })

    await Promise.all(updates)

    return NextResponse.json({ message: `Auth provider "${provider}" configuration updated successfully` })

  } catch (error) {
    console.error("Admin auth-providers update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
