import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { memberId: true, activePackageId: true },
    })

    let packages
    if (!user?.memberId) {
      packages = await db.package.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" },
      })
    } else {
      packages = await db.package.findMany({
        where: { ispId: user.memberId, isActive: true },
        orderBy: { price: "asc" },
      })
    }

    return NextResponse.json({
      data: packages,
      activePackageId: user?.activePackageId || null,
    })
  } catch (error) {
    console.error("Client packages GET error:", error)
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
  }
}
