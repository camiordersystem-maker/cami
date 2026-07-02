import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { forbidden, internalError, notFound, ok, unauthorized } from "@/lib/api-response";

export async function GET() {
  const session = await auth();
  if (!session) return unauthorized();
  if ((session.user as { role: string }).role !== "member") return forbidden();

  try {
    const [published] = await db
      .select()
      .from(schema.terms)
      .where(eq(schema.terms.isPublished, true))
      .orderBy(desc(schema.terms.version))
      .limit(1);

    if (!published) return ok({ required: false, agreed: true, terms: null });

    const [consent] = await db
      .select()
      .from(schema.memberTermsConsents)
      .where(eq(schema.memberTermsConsents.memberId, session.user.id))
      .orderBy(desc(schema.memberTermsConsents.agreedAt))
      .limit(1);

    return ok({
      required: true,
      agreed: consent?.termsId === published.id,
      terms: published,
      consent: consent ?? null,
    });
  } catch (e) {
    console.error("terms consent GET error:", e);
    return internalError("約款同意状況の取得に失敗しました");
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return unauthorized();
  if ((session.user as { role: string }).role !== "member") return forbidden();

  try {
    const [published] = await db
      .select()
      .from(schema.terms)
      .where(eq(schema.terms.isPublished, true))
      .orderBy(desc(schema.terms.version))
      .limit(1);

    if (!published) return notFound("公開済み約款がありません");

    const requestId = crypto.randomUUID();
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const [existing] = await db
      .select()
      .from(schema.memberTermsConsents)
      .where(eq(schema.memberTermsConsents.memberId, session.user.id))
      .orderBy(desc(schema.memberTermsConsents.agreedAt))
      .limit(1);

    if (existing?.termsId === published.id) {
      return ok({ agreed: true, termsId: published.id, version: published.version }, "同意済みです");
    }

    await db.insert(schema.memberTermsConsents).values({
      memberId: session.user.id,
      termsId: published.id,
      version: published.version,
      requestId,
      ipAddress,
    });

    await db.insert(schema.auditLogs).values({
      actorId: session.user.id,
      actorRole: "member",
      action: "agree_terms",
      targetType: "terms",
      targetId: published.id,
      afterValue: JSON.stringify({ version: published.version, requestId }),
      ipAddress,
    });

    return ok({ agreed: true, termsId: published.id, version: published.version }, "約款に同意しました");
  } catch (e) {
    console.error("terms consent POST error:", e);
    return internalError("約款同意の保存に失敗しました");
  }
}
