import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "契約書・約款" };

export default async function MemberTermsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  let published = null;
  try {
    const rows = await db
      .select()
      .from(schema.terms)
      .where(eq(schema.terms.isPublished, true))
      .limit(1);
    published = rows[0] ?? null;
  } catch {
    // terms table not yet migrated
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">契約書・約款</h1>
        <p className="text-slate-500 text-sm mt-1">Camiヘアオイル 取引約款</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {!published ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            現在、約款は公開されていません
          </div>
        ) : (
          <>
            <div className="text-xs text-slate-400 mb-6 pb-4 border-b border-slate-100">
              公開日: {formatDateTime(published.publishedAt)}
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
              {published.content}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
