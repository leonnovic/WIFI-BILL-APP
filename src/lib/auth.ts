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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(credentials.email)) {
          throw new Error("Invalid email format")
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() }
        })

        if (!user) {
          throw new Error("No account found with this email")
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Please contact support.")
        }

        if (user.status === "suspended" || user.status === "SUSPENDED") {
          throw new Error("Your account has been suspended. Please contact support.")
        }

        // Check role match if specified (case-insensitive)
        if (credentials.role) {
          const userRole = user.role.toLowerCase()
          const requestedRole = credentials.role.toLowerCase()
          if (userRole !== requestedRole) {
            throw new Error(
              `This account is registered as '${user.role}', not '${credentials.role}'. Please use the correct login tab.`
            )
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
          role: user.role.toLowerCase(),
          image: user.avatar,
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // Apple provider placeholder - configure when Apple Developer credentials are available
    // AppleProvider({
    //   clientId: process.env.APPLE_CLIENT_ID || "",
    //   clientSecret: process.env.APPLE_CLIENT_SECRET || "",
    // }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role || "client"
        token.id = user.id
      }

      // On subsequent calls, refresh user data from DB to catch role/status changes
      if (token.id && !user) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, isActive: true, status: true }
          })
          if (dbUser) {
            if (!dbUser.isActive || dbUser.status === "suspended") {
              // Force re-auth if account is deactivated
              return { ...token, error: "AccountDeactivated" }
            }
            token.role = dbUser.role.toLowerCase()
          }
        } catch {
          // If DB lookup fails, keep existing token data
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }

      // Propagate error to client
      if ((token as any).error) {
        (session as any).error = (token as any).error
      }

      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Auto-create user as "client" for Google OAuth
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
          } else {
            // Update avatar if changed
            if (user.image && existingUser.avatar !== user.image) {
              await db.user.update({
                where: { id: existingUser.id },
                data: { avatar: user.image, emailVerified: true }
              })
            }
          }
        } catch (error) {
          console.error("Google sign-in error:", error)
          throw new Error("Failed to process Google sign-in. Please try again.")
        }
      }

      // Apple provider placeholder
      // if (account?.provider === "apple") { ... }

      return true
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
