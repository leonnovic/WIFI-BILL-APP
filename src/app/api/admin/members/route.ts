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
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = { role: "member" }
    if (status) where.status = status.toLowerCase()
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { businessName: { contains: search } },
      ]
    }

    const [members, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, businessName: true,
          kraPin: true, status: true, phone: true, createdAt: true,
          _count: { select: { clients: true, routers: true, ispPackages: true } },
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({ data: members, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("Admin members GET error:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}
