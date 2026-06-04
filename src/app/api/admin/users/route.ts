import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = {}
    if (role) where.role = role.toLowerCase()
    if (status) where.status = status.toLowerCase()
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, role: true, status: true,
          phone: true, businessName: true, createdAt: true, avatar: true,
          isActive: true,
          _count: { select: { clients: true, transactions: true, routers: true } },
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({ data: users, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("Admin users GET error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { name, email, password, role, phone, businessName, businessRegNo, businessAddress, kraPin, status, okoaLimit } = body

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 })

    const hashedPassword = password ? await bcrypt.hash(password, 12) : await bcrypt.hash("password123", 12)

    const user = await db.user.create({
      data: {
        name: name || "",
        email,
        password: hashedPassword,
        role: (role || "client").toLowerCase(),
        phone: phone || null,
        businessName: businessName || null,
        businessRegNo: businessRegNo || null,
        businessAddress: businessAddress || null,
        kraPin: kraPin || null,
        status: (status || "active").toLowerCase(),
        okoaLimit: okoaLimit || 500,
        emailVerified: true,
        phoneVerified: !!phone,
        isActive: true,
      },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    console.error("Admin users POST error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
