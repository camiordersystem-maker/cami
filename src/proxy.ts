import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 認証不要のパス
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",
  "/api/register",
  "/api/health",
  "/api/readiness",
  "/api/webhooks/line",
  "/_next",
  "/favicon.ico",
  "/cami-logo.png",
]


// Cami cross-site mutation protection
//
// Defense in depth in addition to SameSite cookies.
//
// Exclusions:
// - /api/auth/*: Auth.js authentication/callback flow
// - /api/webhooks/line: authenticated separately with LINE signature
//
// Requests without browser Origin / Fetch Metadata headers remain compatible
// with trusted server-to-server clients.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

function isCrossSiteProtectionExempt(pathname: string) {
  return (
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/webhooks/line"
  )
}

function shouldBlockCrossSiteMutation(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/api/")) {
    return false
  }

  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return false
  }

  if (isCrossSiteProtectionExempt(pathname)) {
    return false
  }

  const fetchSite = request.headers.get("sec-fetch-site")

  if (fetchSite === "cross-site") {
    return true
  }

  const origin = request.headers.get("origin")

  if (!origin) {
    return false
  }

  try {
    return new URL(origin).origin !== request.nextUrl.origin
  } catch {
    return true
  }
}

function withSecurityHeaders(response: NextResponse) {




  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }
  return response
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (shouldBlockCrossSiteMutation(request)) {
    return withSecurityHeaders(
      NextResponse.json(
        {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "この送信元からの操作は許可されていません",
          },
        },
        { status: 403 }
      )
    )
  }

  // 公開パスはそのまま通す
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  if (isPublic) {
    return withSecurityHeaders(NextResponse.next())
  }

  // セッションcookieの存在確認のみ（復号はしない）
  const sessionToken =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token")

  if (!sessionToken) {
    // API routes: return JSON so `fetch().json()` doesn't choke on the
    // redirected login HTML page (which happens when a session expires
    // mid-session and the client silently follows the 307).
    if (pathname.startsWith("/api/")) {
      return withSecurityHeaders(
        NextResponse.json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "ログインしてください" } },
          { status: 401 }
        )
      )
    }
    // 未ログイン → /login にリダイレクト
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return withSecurityHeaders(NextResponse.redirect(loginUrl))
  }

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
