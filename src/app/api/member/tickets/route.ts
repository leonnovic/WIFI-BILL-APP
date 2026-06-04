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
    const tickets = await db.ticket.findMany({
      where: { ispId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json({ data: tickets })
  } catch (error) {
    console.error("Member tickets GET error:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
