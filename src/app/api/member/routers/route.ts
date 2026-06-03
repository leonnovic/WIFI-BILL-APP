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
    if (userRole !== "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const memberId = (session.user as any).id

    const routers = await db.router.findMany({
      where: { ownerId: memberId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: routers })

  } catch (error) {
    console.error("Member routers list error:", error)
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
    if (userRole !== "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const memberId = (session.user as any).id
    const body = await request.json()
    const { name, ipAddress, username, password, model, location } = body

    if (!name || !ipAddress) {
      return NextResponse.json({ error: "Name and IP address are required" }, { status: 400 })
    }

    // Test connection
    let connectionStatus = "offline"
    if (ipAddress) {
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
        ownerId: memberId,
      },
    })

    return NextResponse.json({ data: router, message: "Router added successfully" }, { status: 201 })

  } catch (error) {
    console.error("Member create router error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
