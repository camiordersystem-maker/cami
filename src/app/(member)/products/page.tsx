"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { apiData, apiErrorMessage } from "@/lib/client-api";
import { FEATURE_FLAGS } from "@/lib/constants";

type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  retailPrice: number;
  bottlesPerBox: number;
  isActive: boolean;
  availableBoxes: number;
  wholesalePricePerBox: number;
  rateApplied: number;
};

type Address = {
  id: string;
  label: string;
  recipientName: string;
  prefecture: string;
  address1: string;
  isDefault: boolean;
};

type CartItem = { productId: string; name: string; boxes: number; unitPrice: number };

export default function ProductsPage() {
  useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedAddress, setSelectedAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"catalog" | "confirm">("catalog");
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const [csvError, setCsvError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/addresses").then((r) => r.json()),
      fetch("/api/feature-flags").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(async ([prods, addrs, flagsJson]) => {
      setProducts(prods);
      setAddresses(addrs);
      const def = addrs.find((a: Address) => a.isDefault);
      if (def) setSelectedAddress(def.id);

      const flagMap = flagsJson ? apiData<Record<string, boolean>>(flagsJson) : {};
      setFlags(flagMap);

      const reorderId = searchParams.get("reorder");
      if (reorderId && flagMap[FEATURE_FLAGS.QUICK_REORDER]) {
        try {
          const res = await fetch(`/api/orders/${reorderId}`);
          if (res.ok) {
            const order = await res.json();
            const nextQuantities: Record<string, number> = {};
            const skipped: string[] = [];
            for (const item of order.items as { productId: string; productName: string; boxes: number }[]) {
              const product = (prods as Product[]).find((p) => p.id === item.productId);
              if (product && product.isActive) {
                nextQuantities[item.productId] = item.boxes;
              } else {
                skipped.push(item.productName);
              }
            }
            setQuantities(nextQuantities);
            setNotice(
              skipped.length > 0
                ? `過去の注文（${order.orderNo}）の内容を読み込みました。「${skipped.join("、")}」は現在ご注文いただけないため除外しています。`
                : `過去の注文（${order.orderNo}）と同じ内容を読み込みました。内容をご確認のうえご注文ください。`
            );
          }
        } catch {
          // 再注文の読み込みに失敗しても通常の商品選択は継続できるようにする
        }
      }

      setLoading(false);
    }).catch(() => {
      setLoading(false);
      setError("データの読み込みに失敗しました。ページを再読み込みしてください。");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateQty(productId: string, val: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, val) }));
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCsvError("");

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r\n|\n|\r/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) { setCsvError("CSVが空です"); return; }

      // ヘッダー行（商品名,箱数）はあってもなくても許容する
      const startIdx = /^商品名/.test(lines[0]) ? 1 : 0;
      const errors: string[] = [];
      const next: Record<string, number> = { ...quantities };
      let appliedCount = 0;

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 2) { errors.push(`${i + 1}行目: 列数が不足しています`); continue; }
        const [name, boxesStr] = cols;
        const boxes = parseInt(boxesStr, 10);
        if (!name) { errors.push(`${i + 1}行目: 商品名が空です`); continue; }
        if (!Number.isFinite(boxes) || boxes < 0) { errors.push(`${i + 1}行目: 箱数が不正です（${boxesStr}）`); continue; }

        const product = products.find((p) => p.name === name);
        if (!product) { errors.push(`${i + 1}行目: 商品「${name}」が見つかりません`); continue; }
        if (!product.isActive) { errors.push(`${i + 1}行目: 商品「${name}」は現在販売しておりません`); continue; }
        if (boxes > product.availableBoxes) {
          errors.push(`${i + 1}行目: 「${name}」は在庫不足です（在庫${product.availableBoxes}箱、指定${boxes}箱）`);
          continue;
        }

        next[product.id] = boxes;
        appliedCount += 1;
      }

      setQuantities(next);
      setCsvError(errors.length > 0 ? errors.join(" / ") : "");
      setNotice(appliedCount > 0 ? `CSVから${appliedCount}件の商品数量を反映しました。内容をご確認ください。` : "");
    };
    reader.onerror = () => setCsvError("ファイルの読み込みに失敗しました");
    reader.readAsText(file, "utf-8");
  }

  function buildCart(): CartItem[] {
    return products
      .filter((p) => (quantities[p.id] ?? 0) > 0)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        boxes: quantities[p.id],
        unitPrice: p.wholesalePricePerBox,
      }));
  }

  function goToConfirm() {
    const items = buildCart();
    if (items.length === 0) { setError("商品を選択してください"); return; }
    if (!selectedAddress) { setError("配送先を選択してください"); return; }
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && item.boxes > prod.availableBoxes) {
        setError(`「${prod.name}」の在庫が不足しています（在庫: ${prod.availableBoxes}箱）`);
        return;
      }
    }
    setCart(items);
    setError("");
    setStep("confirm");
  }

  async function submitOrder() {
    setOrdering(true);
    setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingAddressId: selectedAddress,
        items: cart.map((i) => ({ productId: i.productId, boxes: i.boxes })),
        memo: memo || undefined,
      }),
    });
    const json = await res.json().catch(() => null);
    setOrdering(false);
    if (!res.ok) { setError(apiErrorMessage(json, "処理を完了できませんでした。もう一度お試しください。")); return; }
    const data = apiData<{ orderId: string }>(json);
    router.push(`/orders/${data.orderId}`);
  }

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.boxes, 0);
  const taxAmount = Math.round(subtotal * 0.10);
  const total = subtotal + taxAmount;
  const cartTotal = products
    .filter((p) => (quantities[p.id] ?? 0) > 0)
    .reduce((sum, p) => sum + p.wholesalePricePerBox * (quantities[p.id] ?? 0), 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  const selectedAddr = addresses.find((a) => a.id === selectedAddress);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setStep("catalog")}
            className="text-slate-500 hover:text-slate-700 text-sm"
          >
            ← 商品選択に戻る
          </button>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">注文内容の確認</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-900">
                注文商品
              </div>
              <div className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.productId} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.boxes} 箱 × {fmt(item.unitPrice)}/箱
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-slate-900">
                      {fmt(item.unitPrice * item.boxes)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl space-y-1.5">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>商品合計（税抜）</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>消費税（10%）</span>
                  <span>{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>送料</span>
                  <span>別途ご連絡します</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>合計（税込・送料別）</span>
                  <span className="text-blue-700 text-lg">{fmt(total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">配送先</h3>
              {selectedAddr && (
                <div className="text-sm text-slate-700 space-y-0.5">
                  <div className="font-medium">{selectedAddr.label}</div>
                  <div>{selectedAddr.recipientName}</div>
                  <div>{selectedAddr.prefecture}{selectedAddr.address1}</div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">備考・メモ（任意）</h3>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="例：〇月〇日着希望、注意事項など"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-6">
              <div className="text-sm text-slate-700 space-y-3 mb-5">
                <div className="flex justify-between text-slate-500">
                  <span>商品合計（税抜）</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>消費税（10%）</span>
                  <span>{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>送料</span>
                  <span>別途ご連絡</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-3">
                  <span>合計（税込・送料別）</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={submitOrder}
                disabled={ordering}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {ordering ? "送信中..." : "この内容で注文する"}
              </button>
              <p className="text-xs text-slate-400 text-center mt-3">
                注文確認後、請求書をお送りします
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">商品注文</h1>
        <p className="text-slate-500 text-sm mt-1">ご希望の数量をご入力ください</p>
      </div>

      {notice && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          {notice}
        </div>
      )}

      {flags[FEATURE_FLAGS.CSV_BULK_ORDER] && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">CSV一括発注</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                「商品名,箱数」の形式のCSVをアップロードすると数量に反映されます（ヘッダー行の有無は問いません）
              </p>
            </div>
            <label className="shrink-0 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg cursor-pointer transition-colors">
              CSVを選択
              <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="hidden" />
            </label>
          </div>
          {csvError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              {csvError}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 space-y-4">
          {products.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
              現在取り扱い商品がありません
            </div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  {p.imageUrl && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    {p.description && (
                      <p className="text-slate-500 text-sm mt-1">{p.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <div className="bg-blue-50 rounded-lg px-3 py-1.5">
                        <span className="text-blue-600 font-bold text-base">{fmt(p.wholesalePricePerBox)}</span>
                        <span className="text-blue-400 text-xs ml-1">/箱</span>
                      </div>
                      <div className="bg-slate-50 rounded-lg px-3 py-1.5 text-slate-500 text-xs">
                        定価 {fmt(p.retailPrice)} × {p.bottlesPerBox}本 × {Math.round(p.rateApplied * 100)}%
                      </div>
                      <div className={`rounded-lg px-3 py-1.5 text-xs ${
                        p.availableBoxes > 10
                          ? "bg-green-50 text-green-700"
                          : p.availableBoxes > 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        在庫: {p.availableBoxes} 箱
                        {flags[FEATURE_FLAGS.LOW_STOCK_BADGE] && p.availableBoxes > 0 && p.availableBoxes <= 10 && (
                          <span className="ml-1 font-semibold">（残りわずか）</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex items-center gap-2">
                    <button
                      onClick={() => updateQty(p.id, (quantities[p.id] ?? 0) - 1)}
                      className="w-8 h-8 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantities[p.id] ?? 0}
                      onChange={(e) => updateQty(p.id, parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
                      onFocus={(e) => e.target.select()}
                      className="w-14 text-center border border-slate-300 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => updateQty(p.id, (quantities[p.id] ?? 0) + 1)}
                      disabled={(quantities[p.id] ?? 0) >= p.availableBoxes}
                      className="w-8 h-8 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center font-bold"
                    >
                      ＋
                    </button>
                  </div>
                </div>

                {(quantities[p.id] ?? 0) > 0 && (
                  <div className="mt-3 bg-blue-50 rounded-lg px-4 py-2 flex justify-between text-sm">
                    <span className="text-blue-700">{quantities[p.id]} 箱 選択中</span>
                    <span className="text-blue-700 font-semibold">
                      {fmt(p.wholesalePricePerBox * (quantities[p.id] ?? 0))}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-4">注文サマリー</h3>

            {/* Address Select */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">配送先</label>
              {addresses.length === 0 ? (
                <a href="/addresses" className="text-sm text-blue-600 hover:underline">
                  配送先を追加してください →
                </a>
              ) : (
                <select
                  value={selectedAddress}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">配送先を選択</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}　{a.recipientName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              {products
                .filter((p) => (quantities[p.id] ?? 0) > 0)
                .map((p) => (
                  <div key={p.id} className="flex justify-between text-sm text-slate-700">
                    <span className="truncate mr-2">{p.name} × {quantities[p.id]}箱</span>
                    <span className="shrink-0">{fmt(p.wholesalePricePerBox * (quantities[p.id] ?? 0))}</span>
                  </div>
                ))}
            </div>

            <div className="border-t border-slate-100 pt-3 mb-5 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>消費税（10%）</span>
                <span>{fmt(Math.round(cartTotal * 0.10))}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>商品合計（税込）</span>
                <span className="text-blue-700">{fmt(cartTotal + Math.round(cartTotal * 0.10))}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={goToConfirm}
              disabled={cartTotal === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              注文内容を確認する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
