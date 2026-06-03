import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
    const skip = (page - 1) * limit

    const where: any = { role: "client" }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [clients, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          status: true,
          avatar: true,
          okoaBalance: true,
          okoaUsed: true,
          connectionStatus: true,
          packageExpiry: true,
          createdAt: true,
          member: {
            select: { id: true, name: true, email: true, businessName: true },
          },
          activePackage: {
            select: { id: true, name: true, speed: true, price: true },
          },
          _count: { select: { transactions: true, tickets: true } },
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      data: clients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error("Admin clients list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
