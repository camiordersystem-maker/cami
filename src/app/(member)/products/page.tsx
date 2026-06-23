"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const { data: session } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedAddress, setSelectedAddress] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"catalog" | "confirm">("catalog");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/addresses").then((r) => r.json()),
    ]).then(([prods, addrs]) => {
      setProducts(prods);
      setAddresses(addrs);
      const def = addrs.find((a: Address) => a.isDefault);
      if (def) setSelectedAddress(def.id);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      setError("データの読み込みに失敗しました。ページを再読み込みしてください。");
    });
  }, []);

  function updateQty(productId: string, val: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, val) }));
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
      }),
    });
    const data = await res.json();
    setOrdering(false);
    if (!res.ok) { setError(data.error ?? "エラーが発生しました"); return; }
    router.push(`/orders/${data.orderId}`);
  }

  const total = cart.reduce((sum, i) => sum + i.unitPrice * i.boxes, 0);
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
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between font-bold">
                <span className="text-slate-900">合計</span>
                <span className="text-blue-700 text-lg">{fmt(total)}</span>
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
          </div>

          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-6">
              <div className="text-sm text-slate-700 space-y-3 mb-5">
                <div className="flex justify-between text-slate-500">
                  <span>小計</span>
                  <span>{fmt(total)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-3">
                  <span>合計金額</span>
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
                      type="number"
                      min={0}
                      max={p.availableBoxes}
                      value={quantities[p.id] ?? 0}
                      onChange={(e) => updateQty(p.id, parseInt(e.target.value) || 0)}
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

            <div className="border-t border-slate-100 pt-3 mb-5">
              <div className="flex justify-between font-bold text-slate-900">
                <span>合計</span>
                <span className="text-blue-700">{fmt(cartTotal)}</span>
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
