import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-helpers"
import { getSMSAPI } from "@/lib/sms"
import { getEmailService } from "@/lib/email"

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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const skip = (page - 1) * limit

    const where: any = { memberId, role: "client" }
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
          okoaBalance: true,
          okoaUsed: true,
          connectionStatus: true,
          packageExpiry: true,
          createdAt: true,
          activePackage: { select: { id: true, name: true, speed: true, price: true } },
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
    console.error("Member clients list error:", error)
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
    const { email, password, name, phone } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const client = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        phone: phone?.trim() || null,
        role: "client",
        memberId,
        isActive: true,
        status: "active",
        emailVerified: true,
        phoneVerified: !!phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Send welcome notifications (async)
    getEmailService().sendWelcomeEmail(normalizedEmail, name.trim(), "client").catch(err =>
      console.error("Welcome email error:", err)
    )
    if (phone) {
      getSMSAPI().sendWelcome(phone, name.trim()).catch(err =>
        console.error("Welcome SMS error:", err)
      )
    }

    return NextResponse.json({ data: client, message: "Client created successfully" }, { status: 201 })

  } catch (error) {
    console.error("Member create client error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
