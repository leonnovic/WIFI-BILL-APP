import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const routers = await db.router.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: routers })
  } catch (error) {
    console.error("Member routers GET error:", error)
    return NextResponse.json({ error: "Failed to fetch routers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const body = await request.json()

    if (!body.name || !body.ipAddress) {
      return NextResponse.json({ error: "Name and IP address are required" }, { status: 400 })
    }

    const router = await db.router.create({
      data: {
        name: body.name,
        ipAddress: body.ipAddress,
        username: body.username || "admin",
        password: body.password || "",
        model: body.model || null,
        location: body.location || null,
        status: (body.status || "offline").toLowerCase(),
        connectedClients: body.connectedClients || 0,
        ownerId: userId,
        isActive: body.isActive !== false,
        lastSeen: body.status === "online" ? new Date() : null,
      },
    })

    return NextResponse.json({ data: router }, { status: 201 })
  } catch (error) {
    console.error("Member routers POST error:", error)
    return NextResponse.json({ error: "Failed to create router" }, { status: 500 })
  }
}
