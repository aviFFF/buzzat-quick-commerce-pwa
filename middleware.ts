import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Only apply this middleware to admin routes except admin login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    // Check for session cookie
    const session = request.cookies.get("admin_session")
    
    // If no session, redirect to admin login
    if (!session) {
      const url = new URL("/admin/login", request.url)
      // Add the original URL as a query parameter for redirection after login
      url.searchParams.set('redirect', encodeURIComponent(pathname))
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
} 