import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfigBase } from "./auth.config";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfigBase,
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
        if (!checkRateLimit(rateLimitKey("login", email), 10, 15 * 60 * 1000)) {
          // ブルートフォース対策のレート制限発動。攻撃者へのヒントを避けるため
          // クライアントへは通常の認証失敗と同じ応答を返すが、監視のためサーバー
          // ログには明示的に記録する。
          console.warn(`[auth] rate limit exceeded for login attempts: ${email}`);
          return null;
        }

        const [admin] = await db
          .select()
          .from(schema.admins)
          .where(eq(schema.admins.email, email));

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
