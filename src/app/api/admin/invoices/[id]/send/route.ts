import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireEditor } from "@/lib/admin-auth";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { FEATURE_FLAGS, NOTIFICATION_TYPES } from "@/lib/constants";
import { sendInvoiceEmail } from "@/lib/email";
import { conflict, forbidden, internalError, notFound, ok } from "@/lib/api-response";

// 管理者が会員へ請求書のメールを送付する（本文にリンクを含める）。
// feature flag invoice_pdf_email が有効な場合のみ利用可能。
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const enabled = await isFeatureEnabled(FEATURE_FLAGS.INVOICE_PDF_EMAIL).catch(() => false);
  if (!enabled) return forbidden();

  try {
    const [invoice] = await db
      .select({
        id: schema.monthlyInvoices.id,
        memberId: schema.monthlyInvoices.memberId,
        invoiceNo: schema.monthlyInvoices.invoiceNo,
        total: schema.monthlyInvoices.total,
      })
      .from(schema.monthlyInvoices)
      .where(eq(schema.monthlyInvoices.id, (await params).id));

    if (!invoice) return notFound("請求書が見つかりません");

    const [member] = await db
      .select({ email: schema.members.email, companyName: schema.members.companyName })
      .from(schema.members)
      .where(eq(schema.members.id, invoice.memberId));

    if (!member) return conflict("会員情報が見つかりません");

    const viewUrl = `${req.nextUrl.origin}/invoices/${invoice.id}`;

    await sendInvoiceEmail({
      to: member.email,
      companyName: member.companyName,
      invoiceNo: invoice.invoiceNo,
      total: invoice.total,
      viewUrl,
    });

    await db.insert(schema.notifications).values({
      memberId: invoice.memberId,
      type: NOTIFICATION_TYPES.INVOICE_ISSUED,
      message: `請求書が送付されました（${invoice.invoiceNo}）`,
    }).catch(() => {});

    await db.insert(schema.auditLogs).values({
      actorId: session!.user.id,
      actorRole: "admin",
      action: "send_invoice_email",
      targetType: "monthly_invoice",
      targetId: invoice.id,
      afterValue: JSON.stringify({ to: member.email }),
    });

    return ok({ sent: true });
  } catch (e) {
    console.error("invoice send error:", e);
    return internalError("送付に失敗しました");
  }
}
