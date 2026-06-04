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
    const type = searchParams.get("type")
    const isActive = searchParams.get("isActive")

    const where: any = {}
    if (type) where.type = type
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === "true"

    const packages = await db.package.findMany({
      where,
      orderBy: { price: "asc" },
      include: {
        isp: { select: { id: true, name: true, businessName: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { subscribers: true, transactions: true } },
      },
    })

    return NextResponse.json({ data: packages })
  } catch (error) {
    console.error("Admin packages GET error:", error)
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const body = await request.json()

    if (!body.name || !body.price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    const pkg = await db.package.create({
      data: {
        name: body.name,
        description: body.description || null,
        speed: body.speed || `${body.speedDown || 5}Mbps`,
        speedDown: parseFloat(body.speedDown) || 5,
        speedUp: parseFloat(body.speedUp) || 2,
        dataLimit: body.dataLimit || "Unlimited",
        dataLimitMB: parseFloat(body.dataLimitMB) || 0,
        price: parseFloat(body.price),
        duration: parseInt(body.duration) || 30,
        durationStr: body.durationStr || "30 days",
        type: (body.type || "standard").toLowerCase(),
        isActive: body.isActive !== false,
        ispId: body.ispId || null,
        createdBy: userId,
      },
    })

    return NextResponse.json({ data: pkg }, { status: 201 })
  } catch (error) {
    console.error("Admin packages POST error:", error)
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 })
  }
}
