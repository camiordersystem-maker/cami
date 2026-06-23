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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開パスはそのまま通す
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  if (isPublic) {
    return NextResponse.next()
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
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
