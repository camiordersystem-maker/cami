"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import NotificationBanner from "@/components/member/NotificationBanner";
import { useEffect, useState } from "react";

const baseNavItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/products", label: "商品注文" },
  { href: "/orders", label: "注文履歴" },
  { href: "/addresses", label: "配送先管理" },
  { href: "/announcements", label: "お知らせ" },
  { href: "/terms", label: "契約書" },
  { href: "/account", label: "アカウント設定" },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { isRead: boolean }[]) => {
        setUnreadAnnouncements(data.filter((a) => !a.isRead).length);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-60 bg-blue-900 text-white flex flex-col shrink-0 min-h-screen">
        <div className="px-6 py-5 border-b border-blue-800">
          <Image src="/cami-logo.png" alt="Cami" width={90} height={36} className="object-contain brightness-0 invert mb-1" />
          <div className="text-blue-300 text-xs mt-0.5">受発注システム（店舗）</div>
        </div>

        <nav className="flex-1 py-4 px-3">
          {baseNavItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const badge = item.href === "/announcements" && unreadAnnouncements > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
                  active
                    ? "bg-blue-700 text-white"
                    : "text-blue-200 hover:bg-blue-800 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadAnnouncements}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-blue-800">
          <div className="text-xs text-blue-200 font-medium truncate mb-0.5">
            {session?.user?.name}
          </div>
          <div className="text-xs text-blue-400 truncate mb-3">
            {session?.user?.email}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-blue-300 hover:text-white transition-colors"
          >
            ログアウト
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-8">
          <NotificationBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
