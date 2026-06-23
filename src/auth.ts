import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

        const [admin] = await db
          .select()
          .from(schema.admins)
          .where(eq(schema.admins.email, email));

        if (admin && admin.isActive) {
          const valid = await bcrypt.compare(password, admin.password);
          if (valid) {
            return { id: admin.id, email: admin.email, name: admin.name, role: "admin" as const };
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
