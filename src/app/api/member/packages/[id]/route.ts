import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    const pkg = await db.package.findFirst({
      where: { id, ispId: memberId },
      include: {
        _count: { select: { subscribers: true, transactions: true } },
      },
    })

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    return NextResponse.json({ data: pkg })

  } catch (error) {
    console.error("Member get package error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const body = await request.json()

    // Ensure package belongs to this member
    const existing = await db.package.findFirst({ where: { id, ispId: memberId } })
    if (!existing) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    const { name, description, speedDown, speedUp, speed, dataLimitMB, dataLimit, price, duration, durationStr, type, isActive } = body
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (speedDown !== undefined) updateData.speedDown = parseFloat(speedDown)
    if (speedUp !== undefined) updateData.speedUp = parseFloat(speedUp)
    if (speed !== undefined) updateData.speed = speed
    if (dataLimitMB !== undefined) updateData.dataLimitMB = parseFloat(dataLimitMB)
    if (dataLimit !== undefined) updateData.dataLimit = dataLimit
    if (price !== undefined) updateData.price = parseFloat(price)
    if (duration !== undefined) updateData.duration = parseInt(duration)
    if (durationStr !== undefined) updateData.durationStr = durationStr
    if (type !== undefined) updateData.type = type
    if (isActive !== undefined) updateData.isActive = isActive

    const pkg = await db.package.update({ where: { id }, data: updateData })

    return NextResponse.json({ data: pkg, message: "Package updated successfully" })

  } catch (error) {
    console.error("Member update package error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    const existing = await db.package.findFirst({ where: { id, ispId: memberId } })
    if (!existing) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    // Check for active subscribers
    const subscribersCount = await db.user.count({ where: { activePackageId: id } })
    if (subscribersCount > 0) {
      await db.package.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: "Package deactivated (has active subscribers)" })
    }

    await db.package.delete({ where: { id } })
    return NextResponse.json({ message: "Package deleted successfully" })

  } catch (error) {
    console.error("Member delete package error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
