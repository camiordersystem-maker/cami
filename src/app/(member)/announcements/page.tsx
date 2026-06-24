"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

type Announcement = {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  expiresAt: string | null;
  isRead: boolean;
};

export default function MemberAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    const data = await fetch("/api/announcements").then((r) => (r.ok ? r.json() : []));
    setAnnouncements(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await fetch(`/api/announcements/${id}/read`, { method: "POST" }).catch(() => {});
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  }

  function toggle(id: string) {
    if (expanded !== id) markRead(id);
    setExpanded(expanded === id ? null : id);
  }

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">お知らせ</h1>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">読み込み中...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          お知らせはありません
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {announcements.map((a) => (
            <div key={a.id} className="px-6 py-4">
              <button
                onClick={() => toggle(a.id)}
                className="w-full text-left flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!a.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 inline-block" />
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.type === "all" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"}`}>
                      {a.type === "all" ? "全体" : "個別"}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(a.createdAt)}</span>
                    {a.expiresAt && (
                      <span className="text-xs text-amber-500">期限: {formatDate(a.expiresAt)}</span>
                    )}
                  </div>
                  <div className={`font-medium text-sm ${a.isRead ? "text-slate-700" : "text-slate-900"}`}>
                    {a.title}
                  </div>
                </div>
                <span className="text-slate-400 shrink-0 text-sm">{expanded === a.id ? "▲" : "▼"}</span>
              </button>
              {expanded === a.id && (
                <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg px-4 py-3">
                  {a.body}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
