import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Mock email verification - always succeed
    const user = await db.user.findUnique({
      where: { email }
    })

    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    })

  } catch (error: any) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    )
  }
}
