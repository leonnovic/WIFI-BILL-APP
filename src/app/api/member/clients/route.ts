import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = (session.user as any).id
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const clients = await db.user.findMany({
      where: { memberId: userId, role: "client" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, phone: true, status: true,
        okoaBalance: true, okoaLimit: true, okoaUsed: true,
        connectionStatus: true, activePackageId: true,
        dataUsed: true, dataLimit: true, packageExpiry: true,
        createdAt: true,
        activePackage: { select: { id: true, name: true, price: true, speed: true } },
      },
    })

    return NextResponse.json({ data: clients })
  } catch (error) {
    console.error("Member clients GET error:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = (session.user as any).id
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { name, email, phone, okoaLimit, password } = body

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 })

    const hashedPassword = password ? await bcrypt.hash(password, 12) : await bcrypt.hash("client123", 12)

    const client = await db.user.create({
      data: {
        name: name || "",
        email,
        phone: phone || null,
        role: "client",
        memberId: userId,
        okoaLimit: okoaLimit || 500,
        password: hashedPassword,
        status: "active",
        isActive: true,
        emailVerified: true,
        phoneVerified: !!phone,
      },
    })

    const { password: _, ...safeClient } = client
    return NextResponse.json({ data: safeClient }, { status: 201 })
  } catch (error) {
    console.error("Member clients POST error:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
