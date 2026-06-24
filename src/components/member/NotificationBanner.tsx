"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  invoice_issued: "📄",
  order_confirmed: "✅",
  order_shipped: "🚚",
};

export default function NotificationBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Notification[]) => {
        setNotifications(data.filter((n) => !n.isRead));
      })
      .catch(() => {});
  }, []);

  if (dismissed || notifications.length === 0) return null;

  async function markAllRead() {
    for (const n of notifications) {
      await fetch(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
    }
    setDismissed(true);
    setNotifications([]);
  }

  if (notifications.length === 1) {
    const n = notifications[0];
    const icon = TYPE_ICON[n.type] ?? "🔔";
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-800 min-w-0">
          <span>{icon}</span>
          <span className="truncate">{n.message}</span>
          {n.orderId && (
            <Link
              href={`/orders/${n.orderId}`}
              className="ml-2 text-amber-700 underline shrink-0 font-medium"
            >
              確認する →
            </Link>
          )}
        </div>
        <button onClick={markAllRead} className="text-amber-600 hover:text-amber-800 text-lg shrink-0 leading-none">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-amber-800">🔔 {notifications.length}件の通知があります</span>
        <button onClick={markAllRead} className="text-amber-600 hover:text-amber-800 text-sm">
          すべて既読にする ✕
        </button>
      </div>
      <ul className="space-y-1">
        {notifications.slice(0, 3).map((n) => (
          <li key={n.id} className="text-sm text-amber-700 flex items-center gap-2">
            <span>{TYPE_ICON[n.type] ?? "🔔"}</span>
            <span>{n.message}</span>
            {n.orderId && (
              <Link href={`/orders/${n.orderId}`} className="text-amber-600 underline text-xs">
                確認 →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
