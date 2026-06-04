import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and OTP code are required" },
        { status: 400 }
      )
    }

    // Mock verification - accept "123456" or any 6-digit code
    const isValid = code === "123456" || /^\d{6}$/.test(code)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid OTP code" },
        { status: 400 }
      )
    }

    // Update user phone verification status
    const user = await db.user.findFirst({
      where: { phone }
    })

    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { phoneVerified: true }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
    })

  } catch (error: any) {
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    )
  }
}
