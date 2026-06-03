import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import bcrypt from "bcryptjs"
import { db } from "./db"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(data: {
  email: string
  password: string
  name?: string
  phone?: string
  role?: string
  businessName?: string
  businessRegNo?: string
  businessAddress?: string
  kraPin?: string
}) {
  const hashedPassword = await hashPassword(data.password)

  return db.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name || null,
      phone: data.phone || null,
      role: data.role || "client",
      emailVerified: true,
      phoneVerified: !!(data.phone),
      isActive: true,
      status: "active",
      businessName: data.businessName || null,
      businessRegNo: data.businessRegNo || null,
      businessAddress: data.businessAddress || null,
      kraPin: data.kraPin || null,
    }
  })
}

export function isAdmin(user: any): boolean {
  return user?.role === "admin"
}

export function isMember(user: any): boolean {
  return user?.role === "member"
}

export function isClient(user: any): boolean {
  return user?.role === "client"
}

export function hasRole(user: any, role: string): boolean {
  return user?.role === role
}
