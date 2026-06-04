import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          throw new Error("No account found with this email")
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated")
        }

        if (user.status === "suspended" || user.status === "SUSPENDED") {
          throw new Error("Your account has been suspended")
        }

        // Check role match if specified (case-insensitive)
        if (credentials.role) {
          const userRole = user.role.toLowerCase()
          const requestedRole = credentials.role.toLowerCase()
          if (userRole !== requestedRole) {
            throw new Error(`This account is registered as '${user.role}', not '${credentials.role}'. Please use the correct login tab.`)
          }
        }

        // If user has password, verify it
        if (user.password) {
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            throw new Error("Invalid password")
          }
        } else {
          // If no password set (e.g. OAuth user), set it now
          const hash = await bcrypt.hash(credentials.password, 12)
          await db.user.update({
            where: { id: user.id },
            data: { password: hash }
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.toLowerCase(), // Normalize to lowercase
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-secret",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "client"
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Auto-create or update user from Google OAuth
        const existingUser = await db.user.findUnique({
          where: { email: user.email! }
        })
        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email!,
              name: user.name || "",
              avatar: user.image || "",
              role: "client",
              emailVerified: true,
              phoneVerified: false,
              isActive: true,
              status: "active",
            }
          })
        }
      }
      return true
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
}
