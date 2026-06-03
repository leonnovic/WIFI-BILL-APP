import { NextResponse } from "next/server"
import { getSMSAPI, generateOTP, storeOTP } from "@/lib/sms"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 })
    }

    const formattedPhone = phone.trim()

    // Generate 6-digit OTP
    const otp = generateOTP(6)

    // Store OTP with 5-minute expiry
    storeOTP(formattedPhone, otp, 5)

    // In development: return OTP in response for testing
    // In production: send via SMS
    if (process.env.NODE_ENV === "production") {
      try {
        await getSMSAPI().sendOTP(formattedPhone, otp)
      } catch (smsError) {
        console.error("SMS sending failed:", smsError)
        return NextResponse.json({ error: "Failed to send OTP via SMS. Please try again." }, { status: 500 })
      }
    }

    return NextResponse.json({
      data: {
        phone: formattedPhone,
        message: "OTP sent successfully",
        // Include OTP in development for testing
        ...(process.env.NODE_ENV !== "production" && { otp }),
      }
    })

  } catch (error) {
    console.error("Phone OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
