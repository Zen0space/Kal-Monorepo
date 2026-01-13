import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Check for session cookie
  const session = request.cookies.get("admin_session");
  const path = request.nextUrl.pathname;

  // 2. Define public paths (e.g. login, static assets)
  const isPublicPath = path === "/login" || path.startsWith("/api/auth") || path.startsWith("/_next") || path.includes(".");

  // 3. Redirect logic
  if (!session && !isPublicPath) {
    // If no session and trying to access protected page -> Redirect to /login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && path === "/login") {
    // If already logged in and trying to access /login -> Redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Ensure middleware runs on relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/trpc (we handle auth inside the route for proxying)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/trpc|_next/static|_next/image|favicon.ico).*)",
  ],
};
