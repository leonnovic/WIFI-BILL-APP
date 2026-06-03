import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
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

    // Get the client's member/ISP
    const client = await db.user.findUnique({
      where: { id: clientId },
      select: { memberId: true },
    })

    if (!client?.memberId) {
      // If no member assigned, show all active packages
      const packages = await db.package.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" },
      })
      return NextResponse.json({ data: packages })
    }

    // Show packages from the client's ISP
    const packages = await db.package.findMany({
      where: { ispId: client.memberId, isActive: true },
      orderBy: { price: "asc" },
    })

    return NextResponse.json({ data: packages })

  } catch (error) {
    console.error("Client packages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
