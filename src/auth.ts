import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfigBase } from "./auth.config";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { readReviewAuthPolicy, reviewAccessAllowed, verifyReviewPassword } from "@/lib/review-auth";
import { readManagedPolicy, managedAccessAllowed, verifyManagedPassword } from "@/lib/managed-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfigBase,
  callbacks: {
    ...authConfigBase.callbacks,
    async jwt(args) {
      const token = authConfigBase.callbacks.jwt(args);
      const policy = readReviewAuthPolicy(process.env.CAMI_REVIEW_AUTH, process.env.APP_ENV);
      const managedPolicy = readManagedPolicy(process.env.CAMI_MANAGED_AUTH, process.env.APP_ENV);
      if (args.user) {
        token.reviewAuthUserId = (args.user as { reviewAuthUserId?: string }).reviewAuthUserId;
        token.managedAuthUserId = (args.user as { managedAuthUserId?: string }).managedAuthUserId;
      }
      if (token.role === "admin") {
        if (typeof token.id !== "string" || !token.id) return null;
        const [admin] = await db.select().from(schema.admins).where(eq(schema.admins.id, token.id));
        if (!admin?.isActive || !["viewer", "editor", "superadmin"].includes(admin.role ?? "")) return null;
        token.adminRole = admin.role;
        const principal = managedPolicy?.principals.find(p => p.kind === "admin" && p.localId === admin.id);
        if (token.managedAuthUserId || principal) {
          if (!principal || token.managedAuthUserId !== principal.authUserId || !await managedAccessAllowed(principal, admin, "admin")) return null;
        }
        if (token.reviewAuthUserId || (policy && admin.id === policy.adminId)) {
          if (!policy || token.reviewAuthUserId !== policy.authUserId || !await reviewAccessAllowed(policy, admin)) return null;
          token.reviewExpiresAt = policy.expiresAt;
        }
      }
      if (token.role === "member") {
        if (typeof token.id !== "string" || !token.id) return null;
        const [member] = await db.select().from(schema.members).where(eq(schema.members.id, token.id));
        if (member?.status !== "approved") return null;
        token.name = member.companyName;
        const principal = managedPolicy?.principals.find(p => p.kind === "member" && p.localId === member.id);
        if (token.managedAuthUserId || principal) {
          if (!principal || token.managedAuthUserId !== principal.authUserId || !await managedAccessAllowed(principal, member, "member")) return null;
        }
      }
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const reviewPolicy = readReviewAuthPolicy(process.env.CAMI_REVIEW_AUTH, process.env.APP_ENV);
        const managedPolicy = readManagedPolicy(process.env.CAMI_MANAGED_AUTH, process.env.APP_ENV);
        if (!checkRateLimit(rateLimitKey("login", email), 10, 15 * 60 * 1000)) {
          // ブルートフォース対策のレート制限発動。攻撃者へのヒントを避けるため
          // クライアントへは通常の認証失敗と同じ応答を返すが、監視のためサーバー
          // ログには明示的に記録する。ただし個人情報は出力しない。
          console.warn("[auth] rate limit exceeded for login attempts");
          return null;
        }

        const managedPrincipal = managedPolicy?.principals.find(p => p.email === email);
        if (managedPolicy && managedPrincipal) {
          const table = managedPrincipal.kind === "admin" ? schema.admins : schema.members;
          const [user] = await db.select().from(table).where(eq(table.email, email));
          if (!user || !await verifyManagedPassword(managedPolicy, managedPrincipal, user, password)) return null;
          return { id: user.id, email: user.email, name: "name" in user ? user.name : user.companyName, role: managedPrincipal.kind, adminRole: managedPrincipal.kind === "admin" ? "editor" : undefined, managedAuthUserId: managedPrincipal.authUserId };
        }

        const [admin] = await db
          .select()
          .from(schema.admins)
          .where(eq(schema.admins.email, email));

        if (reviewPolicy && email === reviewPolicy.email) {
          if (!admin?.isActive || !await verifyReviewPassword(reviewPolicy, admin, password)) return null;
          return { id: admin.id, email: admin.email, name: admin.name, role: "admin" as const, adminRole: "viewer", reviewAuthUserId: reviewPolicy.authUserId };
        }
        if (admin && admin.isActive) {
          const valid = await bcrypt.compare(password, admin.password);
          if (valid) {
            return { id: admin.id, email: admin.email, name: admin.name, role: "admin" as const, adminRole: admin.role ?? "superadmin" };
          }
        }

        const [member] = await db
          .select()
          .from(schema.members)
          .where(eq(schema.members.email, email));

        if (member) {
          const valid = await bcrypt.compare(password, member.password);
          if (!valid) return null;
          if (member.status !== "approved") return null;
          return { id: member.id, email: member.email, name: member.companyName, role: "member" as const };
        }

        return null;
      },
    }),
  ],
});
