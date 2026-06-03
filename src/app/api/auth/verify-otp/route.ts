import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyOTP } from "@/lib/sms"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone number and OTP code are required" }, { status: 400 })
    }

    // Verify the OTP
    const isValid = verifyOTP(phone.trim(), code.toString())

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 })
    }

    // Find user by phone and update phoneVerified
    const user = await db.user.findFirst({
      where: { phone: phone.trim() }
    })

    if (!user) {
      return NextResponse.json({ error: "No account found with this phone number" }, { status: 404 })
    }

    await db.user.update({
      where: { id: user.id },
      data: { phoneVerified: true }
    })

    return NextResponse.json({
      data: {
        verified: true,
        message: "Phone number verified successfully"
      }
    })

  } catch (error) {
    console.error("OTP verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
