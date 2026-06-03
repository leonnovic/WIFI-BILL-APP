import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const apiKeys = await db.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Mask the actual key for security
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: key.key.slice(0, 8) + "..." + key.key.slice(-4),
    }))

    return NextResponse.json({ data: maskedKeys })

  } catch (error) {
    console.error("Admin api-keys list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminId = (session.user as any).id
    const body = await request.json()
    const { name, permissions, expiresAt } = body

    if (!name) {
      return NextResponse.json({ error: "API key name is required" }, { status: 400 })
    }

    // Generate random API key
    const apiKey = `ispl_${uuidv4().replace(/-/g, "")}_${Date.now().toString(36)}`

    const newKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        key: apiKey,
        userId: adminId,
        permissions: permissions || "read",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    // Return the full key only on creation (this is the only time the user sees it)
    return NextResponse.json({ data: newKey, message: "API key created successfully. Save this key - you won't see it again!" }, { status: 201 })

  } catch (error) {
    console.error("Admin create api-key error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
