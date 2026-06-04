import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const packages = await db.package.findMany({
      where: { ispId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { subscribers: true, transactions: true } },
      },
    })

    return NextResponse.json({ data: packages })
  } catch (error) {
    console.error("Member packages GET error:", error)
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
        ispId: userId,
        createdBy: userId,
      },
    })

    return NextResponse.json({ data: pkg }, { status: 201 })
  } catch (error) {
    console.error("Member packages POST error:", error)
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 })
  }
}
