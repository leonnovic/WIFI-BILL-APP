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
    if (userRole !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const type = searchParams.get("type") || ""
    const skip = (page - 1) * limit

    const where: any = { userId: clientId }
    if (type) where.type = type

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          package: { select: { id: true, name: true, speed: true, price: true } },
        },
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error("Client transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
