import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hkdf, jwtDecrypt } from "jose";

const PUBLIC_PATHS = ["/login", "/register", "/api/register", "/api/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

async function getSessionRole(req: NextRequest): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  // NextAuth v5 uses __Secure- prefix in production (HTTPS), without in dev
  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value;
  if (!token) return null;

  try {
    // NextAuth v5 derives the JWE key via HKDF (same as @auth/core/jwt.ts)
    const encKey = await hkdf(
      "sha256",
      secret,
      "",
      "Auth.js Generated Encryption Key",
      32
    );
    const { payload } = await jwtDecrypt(token, encKey);
    return (payload as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const role = await getSessionRole(req);
  const isLoggedIn = role !== null;

  if (!isLoggedIn && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn) {
    if (pathname === "/login" || pathname === "/register") {
      const dest = role === "admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    if (pathname === "/") {
      const dest = role === "admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    if (
      role === "admin" &&
      !pathname.startsWith("/admin") &&
      !isPublic(pathname) &&
      !pathname.startsWith("/api")
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (role === "member" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
