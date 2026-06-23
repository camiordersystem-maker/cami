import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import PrintButton from "@/app/(member)/orders/[id]/invoice/PrintButton";

export const metadata = { title: "納品書" };

export default async function DeliveryNotePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") redirect("/login");

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, params.id));

  if (!order) notFound();

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
    .where(eq(schema.members.id, order.memberId));

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls */}
      <div className="no-print bg-slate-100 px-8 py-3 flex items-center justify-between border-b border-slate-200">
        <a href={`/admin/orders/${params.id}`} className="text-sm text-blue-600 hover:underline">
          ← 注文詳細に戻る
        </a>
        <PrintButton />
      </div>

      {/* Delivery Note */}
      <div className="max-w-2xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="text-3xl font-bold text-slate-900">納 品 書</div>
            <div className="text-slate-500 text-sm mt-1">DELIVERY NOTE</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-slate-900">{process.env.COMPANY_NAME ?? "Cami"}</div>
            <div className="text-sm text-slate-600 mt-1">
              〒{process.env.COMPANY_POSTAL_CODE ?? "000-0000"}<br />
              {process.env.COMPANY_ADDRESS ?? "東京都○○区○○1-2-3"}<br />
              TEL: {process.env.COMPANY_TEL ?? "03-0000-0000"}
            </div>
          </div>
        </div>

        {/* Ship To */}
        <div className="mb-8">
          <div className="font-semibold text-slate-900 mb-2 text-sm">納品先</div>
          <div className="text-slate-800">
            <div className="text-lg font-bold">{member?.companyName} 御中</div>
            <div className="text-sm text-slate-600 mt-1">{member?.contactName} 様</div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-slate-500 text-xs mb-1">注文番号</div>
            <div className="font-semibold text-slate-900">{order.orderNo}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-slate-500 text-xs mb-1">発行日</div>
            <div className="font-semibold text-slate-900">{formatDate(new Date())}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-slate-500 text-xs mb-1">注文日</div>
            <div className="font-semibold text-slate-900">{formatDate(order.createdAt)}</div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="text-left py-2 font-semibold text-slate-900">商品名</th>
              <th className="text-center py-2 font-semibold text-slate-900">箱数</th>
              <th className="text-center py-2 font-semibold text-slate-900">本数/箱</th>
              <th className="text-right py-2 font-semibold text-slate-900">合計本数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item: (typeof items)[0]) => (
              <tr key={item.id}>
                <td className="py-3 text-slate-800">{item.productName}</td>
                <td className="py-3 text-center text-slate-800">{item.boxes} 箱</td>
                <td className="py-3 text-center text-slate-800">{item.bottlesPerBox} 本</td>
                <td className="py-3 text-right font-medium text-slate-900">{item.boxes * item.bottlesPerBox} 本</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900">
              <td className="py-3 font-bold text-slate-900" colSpan={3}>合計</td>
              <td className="py-3 text-right font-bold text-slate-900">
                {items.reduce((s: number, i: typeof items[0]) => s + i.boxes * i.bottlesPerBox, 0)} 本
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Shipping Address */}
        {address && (
          <div className="mt-6 text-sm border-t border-slate-200 pt-6">
            <div className="font-semibold text-slate-900 mb-2">配送先</div>
            <div className="text-slate-600">
              〒{address.postalCode}　{address.prefecture}{address.address1}
              {address.address2 && ` ${address.address2}`}<br />
              {address.recipientName}　{address.phone}
            </div>
          </div>
        )}

        {order.trackingNumber && (
          <div className="mt-4 text-sm">
            <span className="font-medium text-slate-900">追跡番号：</span>
            <span className="text-slate-700">{order.trackingNumber}</span>
          </div>
        )}

        {order.memo && (
          <div className="mt-6 bg-slate-50 rounded-lg px-4 py-3 text-sm">
            <div className="font-medium text-slate-900 mb-1">備考</div>
            <div className="text-slate-700 whitespace-pre-wrap">{order.memo}</div>
          </div>
        )}

        <div className="mt-10 text-center text-xs text-slate-400">
          上記のとおり納品いたします。ご確認をお願いいたします。
        </div>
      </div>
    </div>
  );
}
