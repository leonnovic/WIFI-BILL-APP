import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getEmailService } from "@/lib/email"
import { v4 as uuidv4 } from "uuid"

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

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        data: { message: "If an account exists with this email, a reset link has been sent." }
      })
    }

    if (!user.isActive || user.status === "suspended") {
      return NextResponse.json({
        data: { message: "If an account exists with this email, a reset link has been sent." }
      })
    }

    // Generate reset token
    const resetToken = uuidv4()
    const expires = new Date(Date.now() + 3600000) // 1 hour

    // Store token in VerificationToken model
    await db.verificationToken.create({
      data: {
        identifier: `reset-password:${normalizedEmail}`,
        token: resetToken,
        expires,
      }
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`

    getEmailService().sendPasswordReset(normalizedEmail, resetUrl, user.name || undefined).catch(err => {
      console.error("Failed to send password reset email:", err)
    })

    return NextResponse.json({
      data: { message: "If an account exists with this email, a reset link has been sent." }
    })

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
