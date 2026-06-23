import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import PrintButton from "./PrintButton";

async function getSettings() {
  try {
    const [s] = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.id, "singleton"));
    return s ?? null;
  } catch { return null; }
}

export const metadata = { title: "請求書" };

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, params.id));

  if (!order || order.memberId !== session.user.id) notFound();
  if (!["confirmed", "shipped", "delivered"].includes(order.status)) {
    redirect(`/orders/${params.id}`);
  }

  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id));

  const [address] = await db
    .select()
    .from(schema.shippingAddresses)
    .where(eq(schema.shippingAddresses.id, order.shippingAddressId));

  const [member] = await db
    .select()
    .from(schema.members)
    .where(eq(schema.members.id, session.user.id));

  const settings = await getSettings();
  const registrationNo = settings?.invoiceRegistrationNo || "T0000000000000";
  const taxRate = typeof order.taxRate === "string" ? parseFloat(order.taxRate) : (order.taxRate ?? 0);
  const taxRatePercent = Math.round(taxRate * 100);
  const taxAmount = order.taxAmount ?? 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls */}
      <div className="no-print bg-slate-100 px-8 py-3 flex items-center justify-between border-b border-slate-200">
        <a href={`/orders/${params.id}`} className="text-sm text-blue-600 hover:underline">
          ← 注文詳細に戻る
        </a>
        <PrintButton />
      </div>

      {/* Invoice */}
      <div className="max-w-2xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="text-3xl font-bold text-slate-900">請 求 書</div>
            <div className="text-slate-500 text-sm mt-1">INVOICE</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-slate-900">{settings?.companyName || "Cami"}</div>
            <div className="text-sm text-slate-600 mt-1">
              {settings?.companyPostalCode && <>〒{settings.companyPostalCode}<br /></>}
              {settings?.companyAddress && <>{settings.companyAddress}<br /></>}
              {settings?.companyTel && <>TEL: {settings.companyTel}<br /></>}
              {settings?.companyEmail && <>Email: {settings.companyEmail}</>}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              登録番号：{registrationNo}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <div className="font-semibold text-slate-900 mb-2 text-sm">請求先</div>
          <div className="text-slate-800">
            <div className="text-lg font-bold">{member?.companyName} 御中</div>
            <div className="text-sm text-slate-600 mt-1">{member?.contactName} 様</div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-slate-500 text-xs mb-1">請求書番号</div>
            <div className="font-semibold text-slate-900">{order.orderNo}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-slate-500 text-xs mb-1">発行日</div>
            <div className="font-semibold text-slate-900">{formatDate(new Date())}</div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="text-left py-2 font-semibold text-slate-900">商品名</th>
              <th className="text-center py-2 font-semibold text-slate-900">数量</th>
              <th className="text-right py-2 font-semibold text-slate-900">単価（/箱）</th>
              <th className="text-right py-2 font-semibold text-slate-900">税抜小計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item: (typeof items)[0]) => (
              <tr key={item.id}>
                <td className="py-3 text-slate-800">
                  <div>{item.productName}</div>
                  <div className="text-xs text-slate-400">
                    {item.bottlesPerBox}本/箱　掛け率{Math.round(Number(item.rateApplied) * 100)}%　※{taxRatePercent}%
                  </div>
                </td>
                <td className="py-3 text-center text-slate-800">{item.boxes} 箱</td>
                <td className="py-3 text-right text-slate-800">{formatCurrency(item.unitPricePerBox)}</td>
                <td className="py-3 text-right font-medium text-slate-900">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-slate-900 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>税抜小計</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>消費税（{taxRatePercent}%）</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
            <span>税込合計金額</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Tax breakdown note for 適格請求書 */}
        <div className="mt-4 bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-500">
          ※印は軽減税率対象外（標準税率 {taxRatePercent}%）です。
        </div>

        {/* Shipping Address */}
        {address && (
          <div className="mt-8 text-sm">
            <div className="font-semibold text-slate-900 mb-2">配送先</div>
            <div className="text-slate-600">
              〒{address.postalCode}　{address.prefecture}{address.address1}
              {address.address2 && ` ${address.address2}`}
              <br />
              {address.recipientName}　{address.phone}
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-400">
          ご不明な点はお気軽にお問い合わせください。{settings?.supportEmail || settings?.companyEmail || ""}
        </div>
      </div>
    </div>
  );
}
