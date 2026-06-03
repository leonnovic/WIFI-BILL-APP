import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-helpers"

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
    const role = searchParams.get("role") || ""
    const status = searchParams.get("status") || ""
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }
    if (role) {
      where.role = role
    }
    if (status) {
      where.status = status
    }

    const [users, total] = await Promise.all([
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
          role: true,
          isActive: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          avatar: true,
          businessName: true,
          memberId: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { clients: true, transactions: true, tickets: true } },
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error("Admin users list error:", error)
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
    const { email, password, name, phone, role, businessName, businessRegNo, businessAddress, kraPin, memberId } = body

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    const validRoles = ["admin", "member", "client"]
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check for duplicate email
    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        phone: phone?.trim() || null,
        role: role || "client",
        emailVerified: true,
        phoneVerified: !!phone,
        isActive: true,
        status: "active",
        businessName: businessName?.trim() || null,
        businessRegNo: businessRegNo?.trim() || null,
        businessAddress: businessAddress?.trim() || null,
        kraPin: kraPin?.trim() || null,
        memberId: memberId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        status: true,
        businessName: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: user, message: "User created successfully" }, { status: 201 })

  } catch (error) {
    console.error("Admin create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
