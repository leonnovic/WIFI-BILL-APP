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
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true,
        businessName: true, businessRegNo: true, businessAddress: true,
        kraPin: true, avatar: true,
      },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error("Member settings GET error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const body = await request.json()

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.phone !== undefined) data.phone = body.phone
    if (body.businessName !== undefined) data.businessName = body.businessName
    if (body.businessRegNo !== undefined) data.businessRegNo = body.businessRegNo
    if (body.businessAddress !== undefined) data.businessAddress = body.businessAddress
    if (body.kraPin !== undefined) data.kraPin = body.kraPin
    if (body.avatar !== undefined) data.avatar = body.avatar

    const user = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, name: true, email: true, phone: true,
        businessName: true, businessRegNo: true, businessAddress: true,
        kraPin: true, avatar: true,
      },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error("Member settings PUT error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
