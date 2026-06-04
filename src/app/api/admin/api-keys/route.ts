import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import crypto from "crypto"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const apiKeys = await db.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    // Mask keys for security
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: key.key.substring(0, 8) + "..." + key.key.substring(key.key.length - 4),
    }))

    return NextResponse.json({ data: maskedKeys })
  } catch (error) {
    console.error("Admin api-keys GET error:", error)
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const body = await request.json()

    if (!body.name) return NextResponse.json({ error: "API key name is required" }, { status: 400 })

    // Generate crypto random key
    const rawKey = `isl_${crypto.randomBytes(32).toString("hex")}`
    const apiKey = await db.apiKey.create({
      data: {
        userId: body.userId || userId,
        name: body.name,
        key: rawKey,
        permissions: body.permissions || "read",
        isActive: true,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })

    return NextResponse.json({ data: apiKey, rawKey }, { status: 201 })
  } catch (error) {
    console.error("Admin api-keys POST error:", error)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}
