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
    const ispId = searchParams.get("ispId") || ""
    const type = searchParams.get("type") || ""
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (ispId) where.ispId = ispId
    if (type) where.type = type

    const [packages, total] = await Promise.all([
      db.package.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          isp: { select: { id: true, name: true, email: true, businessName: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { subscribers: true, transactions: true } },
        },
      }),
      db.package.count({ where }),
    ])

    return NextResponse.json({
      data: packages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error("Admin packages list error:", error)
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

    const adminId = (session.user as any).id
    const body = await request.json()
    const { name, description, speedDown, speedUp, speed, dataLimitMB, dataLimit, price, duration, durationStr, type, ispId } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    const pkg = await db.package.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        speedDown: parseFloat(speedDown) || 5,
        speedUp: parseFloat(speedUp) || 2,
        speed: speed || `${speedDown || 5}Mbps`,
        dataLimitMB: parseFloat(dataLimitMB) || 0,
        dataLimit: dataLimit || (dataLimitMB ? `${dataLimitMB}MB` : "Unlimited"),
        price: parseFloat(price),
        duration: parseInt(duration) || 30,
        durationStr: durationStr || "30d",
        type: type || "standard",
        ispId: ispId || null,
        createdBy: adminId,
      },
      include: {
        isp: { select: { id: true, name: true, businessName: true } },
      },
    })

    return NextResponse.json({ data: pkg, message: "Package created successfully" }, { status: 201 })

  } catch (error) {
    console.error("Admin create package error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
