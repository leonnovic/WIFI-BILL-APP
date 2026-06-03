import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-helpers"
import { getEmailService } from "@/lib/email"
import { getSMSAPI, generateOTP, storeOTP } from "@/lib/sms"

// Email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password strength: min 8 chars, at least one uppercase, one lowercase, one digit
function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one digit" }
  }
  return { valid: true }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, phone, role, businessName, businessRegNo, businessAddress, kraPin } = body

    // Validate email
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Validate password
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }
    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 })
    }

    // Validate name
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Name is required (at least 2 characters)" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["admin", "member", "client"]
    const userRole = role?.toLowerCase() || "client"
    if (!validRoles.includes(userRole)) {
      return NextResponse.json({ error: "Invalid role. Must be admin, member, or client" }, { status: 400 })
    }

    // Member-specific validation
    if (userRole === "member") {
      if (!businessName || businessName.trim().length < 2) {
        return NextResponse.json({ error: "Business name is required for ISP members" }, { status: 400 })
      }
    }

    // Check for duplicate email
    const normalizedEmail = email.toLowerCase().trim()
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        phone: phone?.trim() || null,
        role: userRole,
        emailVerified: true, // Auto-verify for now
        phoneVerified: !!(phone), // Auto-verify phone if provided
        isActive: true,
        status: "active",
        // Member/ISP specific fields
        businessName: userRole === "member" ? businessName?.trim() : null,
        businessRegNo: userRole === "member" ? businessRegNo?.trim() : null,
        businessAddress: userRole === "member" ? businessAddress?.trim() : null,
        kraPin: userRole === "member" ? kraPin?.trim() : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        businessName: true,
        businessRegNo: true,
        businessAddress: true,
        kraPin: true,
        createdAt: true,
      }
    })

    // Send welcome email (async, don't block response)
    getEmailService().sendWelcomeEmail(normalizedEmail, name.trim(), userRole).catch(err => {
      console.error("Failed to send welcome email:", err)
    })

    // Send welcome SMS if phone provided (async)
    if (phone) {
      getSMSAPI().sendWelcome(phone, name.trim()).catch(err => {
        console.error("Failed to send welcome SMS:", err)
      })
    }

    return NextResponse.json({
      data: user,
      message: "Account created successfully"
    }, { status: 201 })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
