import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-helpers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, email, password } = body

    if (!token || !email || !password) {
      return NextResponse.json({ error: "Token, email, and new password are required" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter" }, { status: 400 })
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one lowercase letter" }, { status: 400 })
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one digit" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const identifier = `reset-password:${normalizedEmail}`

    // Find the token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Check if token matches the email
    if (verificationToken.identifier !== identifier) {
      return NextResponse.json({ error: "Invalid reset token for this email" }, { status: 400 })
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({ where: { token } })
      return NextResponse.json({ error: "Reset token has expired. Please request a new one." }, { status: 400 })
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Delete used token
    await db.verificationToken.delete({ where: { token } })

    // Also delete any other reset tokens for this email
    const allTokens = await db.verificationToken.findMany({
      where: { identifier }
    })
    if (allTokens.length > 0) {
      await db.verificationToken.deleteMany({ where: { identifier } })
    }

    return NextResponse.json({
      data: { message: "Password has been reset successfully. You can now log in with your new password." }
    })

  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
