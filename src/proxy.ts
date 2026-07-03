import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 認証不要のパス
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",
  "/api/register",
  "/_next",
  "/favicon.ico",
]

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:")
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }
  return response
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
