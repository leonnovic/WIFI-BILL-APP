import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const pkg = await db.package.findUnique({
      where: { id },
      include: {
        isp: { select: { id: true, name: true, businessName: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { subscribers: true, transactions: true } },
      },
    })
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 })

    return NextResponse.json({ data: pkg })
  } catch (error) {
    console.error("Admin package GET error:", error)
    return NextResponse.json({ error: "Failed to fetch package" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await request.json()

    const existing = await db.package.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 })

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.speed !== undefined) data.speed = body.speed
    if (body.speedDown !== undefined) data.speedDown = parseFloat(body.speedDown)
    if (body.speedUp !== undefined) data.speedUp = parseFloat(body.speedUp)
    if (body.dataLimit !== undefined) data.dataLimit = body.dataLimit
    if (body.dataLimitMB !== undefined) data.dataLimitMB = parseFloat(body.dataLimitMB)
    if (body.price !== undefined) data.price = parseFloat(body.price)
    if (body.duration !== undefined) data.duration = parseInt(body.duration)
    if (body.durationStr !== undefined) data.durationStr = body.durationStr
    if (body.type !== undefined) data.type = body.type.toLowerCase()
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.ispId !== undefined) data.ispId = body.ispId

    const pkg = await db.package.update({ where: { id }, data })
    return NextResponse.json({ data: pkg })
  } catch (error) {
    console.error("Admin package PUT error:", error)
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const existing = await db.package.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 })

    // Check if any users are subscribed
    const subscriberCount = await db.user.count({ where: { activePackageId: id } })
    if (subscriberCount > 0) {
      return NextResponse.json({ error: `Cannot delete: ${subscriberCount} users are subscribed to this package` }, { status: 400 })
    }

    await db.package.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("Admin package DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 })
  }
}
