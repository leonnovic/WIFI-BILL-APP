import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, phone, role, businessName, businessRegNo, businessAddress, kraPin } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Validate role
    const validRoles = ["admin", "member", "client"]
    const userRole = validRoles.includes(role) ? role : "client"

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user - auto-verify email and phone (mock verification)
    const user = await db.user.create({
      data: {
        email,
        name: name || "",
        password: hashedPassword,
        phone: phone || null,
        role: userRole,
        emailVerified: true,  // Auto-verify (mock)
        phoneVerified: !!(phone),  // Auto-verify if phone provided (mock)
        isActive: true,
        status: "active",
        businessName: businessName || null,
        businessRegNo: businessRegNo || null,
        businessAddress: businessAddress || null,
        kraPin: kraPin || null,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    )
  }
}
