import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow API routes, static files, auth pages, and public pages
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return NextResponse.next()
  }

  // Check if this is a protected route
  const protectedRoutes: Record<string, string> = {
    "/admin": "admin",
    "/member": "member",
    "/client": "client",
  }

  let requiredRole: string | null = null
  for (const [prefix, role] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(prefix)) {
      requiredRole = role
      break
    }
  }

  // Not a protected route, allow
  if (!requiredRole) {
    return NextResponse.next()
  }

  // Check for JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role match (compare case-insensitive)
  const userRole = (token.role as string || "").toLowerCase()
  if (userRole !== requiredRole.toLowerCase()) {
    // Redirect to their correct portal
    const redirectMap: Record<string, string> = {
      admin: "/admin/dashboard",
      member: "/member/dashboard",
      client: "/client/dashboard",
    }
    const correctPath = redirectMap[userRole] || "/login"
    return NextResponse.redirect(new URL(correctPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/member/:path*", "/client/:path*"],
}
