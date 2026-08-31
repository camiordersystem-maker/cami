import type { NextAuthConfig } from "next-auth";

export const authConfigBase = {
  // Vercel/Cloudflare Workersなどエッジ実行環境ではリクエストの転送経路が
  // 挟まるため、Auth.jsが受け取るHostヘッダーを自前で検証できず
  // デフォルトでは「信頼できないホスト」としてエラーになる
  // (UntrustedHost)。TLS終端・Hostヘッダーの正当性はプラットフォーム側
  // (Vercel/Cloudflare)が担保しているため、ここでは信頼して問題ない。
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role as "admin" | "member";
        token.adminRole = (user as { adminRole?: string }).adminRole;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { adminRole?: string }).adminRole = token.adminRole as string | undefined;
      }
      return session;
    },
  },
  // JWTセッションはステートレスなため、パスワード変更やログアウト操作を
  // 他端末の既存セッションへ即座に反映できない。maxAgeを短くして、
  // セッション漏えい・端末紛失時の影響時間を抑える（既定の30日は長すぎる）。
  session: { strategy: "jwt" as const, maxAge: 14 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
} satisfies Omit<NextAuthConfig, "providers">;

/**
 * Edge / Proxy 用Auth.js設定。
 *
 * Credentials ProviderはDB・bcryptを使用するためauth.ts側だけで追加する。
 * Edge側では空のprovidersを維持する。
 */
export const authConfig = {
  ...authConfigBase,
  providers: [],
} satisfies NextAuthConfig;
