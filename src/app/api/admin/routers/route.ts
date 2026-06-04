import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status.toLowerCase()

    const [routers, total] = await Promise.all([
      db.router.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, businessName: true } },
        },
      }),
      db.router.count({ where }),
    ])

    return NextResponse.json({ data: routers, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("Admin routers GET error:", error)
    return NextResponse.json({ error: "Failed to fetch routers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()

    if (!body.name || !body.ipAddress || !body.ownerId) {
      return NextResponse.json({ error: "Name, IP address, and owner are required" }, { status: 400 })
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
        ownerId: body.ownerId,
        isActive: body.isActive !== false,
        lastSeen: body.status === "online" ? new Date() : null,
      },
    })

    return NextResponse.json({ data: router }, { status: 201 })
  } catch (error) {
    console.error("Admin routers POST error:", error)
    return NextResponse.json({ error: "Failed to create router" }, { status: 500 })
  }
}
