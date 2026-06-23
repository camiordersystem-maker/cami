import type { NextAuthConfig } from "next-auth";

export const authConfig = {
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
  providers: [], // Credentials added in auth.ts (Node.js only)
  session: { strategy: "jwt" as const },
} satisfies NextAuthConfig;
