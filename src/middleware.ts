import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Use Edge-compatible auth (no bcryptjs) for middleware
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register", "/api/register", "/api/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session) {
    // Redirect logged-in users away from login/register
    if (pathname === "/login" || pathname === "/register") {
      const dest = role === "admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Root redirect
    if (pathname === "/") {
      const dest = role === "admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Admin trying to access member routes
    if (role === "admin" && !pathname.startsWith("/admin") && !isPublic(pathname) && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Member trying to access admin routes
    if (role === "member" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
