import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getEmailService } from "@/lib/email"
import { generateOTP, storeOTP } from "@/lib/sms"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await db.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({ data: { message: "If an account exists with this email, a verification code has been sent." } })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
    }

    // Generate verification code
    const code = generateOTP(6)

    // Store the code (reuse OTP store with email as identifier)
    storeOTP(`email:${normalizedEmail}`, code, 5)

    // Send verification email
    try {
      await getEmailService().sendVerificationEmail(normalizedEmail, code, user.name || undefined)
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      return NextResponse.json({ error: "Failed to send verification email. Please try again." }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        message: "Verification code sent to your email",
        // Include code in development
        ...(process.env.NODE_ENV !== "production" && { code }),
      }
    })

  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
