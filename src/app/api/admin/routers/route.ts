import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { testRouterConnection } from "@/lib/mikrotik"

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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { ipAddress: { contains: search } },
        { location: { contains: search } },
      ]
    }
    if (status) where.status = status

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

    return NextResponse.json({
      data: routers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error("Admin routers list error:", error)
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

    const body = await request.json()
    const { name, ipAddress, username, password, model, location, ownerId } = body

    if (!name || !ipAddress || !ownerId) {
      return NextResponse.json({ error: "Name, IP address, and owner ID are required" }, { status: 400 })
    }

    // Verify owner exists
    const owner = await db.user.findUnique({ where: { id: ownerId } })
    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 })
    }

    // Test connection if credentials provided
    let connectionStatus = "offline"
    if (ipAddress && username) {
      try {
        const result = await testRouterConnection({
          host: ipAddress,
          port: 8728,
          username: username || "admin",
          password: password || "",
          timeout: 5000,
        })
        connectionStatus = result.success ? "online" : "offline"
      } catch {
        connectionStatus = "offline"
      }
    }

    const router = await db.router.create({
      data: {
        name: name.trim(),
        ipAddress: ipAddress.trim(),
        username: username?.trim() || "admin",
        password: password || "",
        model: model?.trim() || null,
        location: location?.trim() || null,
        status: connectionStatus,
        ownerId,
      },
      include: {
        user: { select: { id: true, name: true, email: true, businessName: true } },
      },
    })

    return NextResponse.json({ data: router, message: "Router created successfully" }, { status: 201 })

  } catch (error) {
    console.error("Admin create router error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
