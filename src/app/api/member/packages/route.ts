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
    if (userRole !== "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const memberId = (session.user as any).id

    const packages = await db.package.findMany({
      where: { ispId: memberId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { subscribers: true, transactions: true } },
      },
    })

    return NextResponse.json({ data: packages })

  } catch (error) {
    console.error("Member packages list error:", error)
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
    const { name, description, speedDown, speedUp, speed, dataLimitMB, dataLimit, price, duration, durationStr, type } = body

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
        dataLimit: dataLimit || "Unlimited",
        price: parseFloat(price),
        duration: parseInt(duration) || 30,
        durationStr: durationStr || "30d",
        type: type || "standard",
        ispId: memberId,
        createdBy: memberId,
      },
    })

    return NextResponse.json({ data: pkg, message: "Package created successfully" }, { status: 201 })

  } catch (error) {
    console.error("Member create package error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
