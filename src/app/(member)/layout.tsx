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

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { isRead: boolean }[]) => {
        setUnreadAnnouncements(
          data.filter((a) => !a.isRead).length
        );
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navContent = (
    <>
      {baseNavItems.map((item) => {
        const active =
          pathname === item.href ||
          (
            item.href !== "/dashboard" &&
            pathname.startsWith(item.href)
          );

        const badge =
          item.href === "/announcements" &&
          unreadAnnouncements > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
              active
                ? "bg-blue-700 text-white"
                : "text-blue-200 hover:bg-blue-800 hover:text-white"
            }`}
          >
            <span>{item.label}</span>

            {badge && (
              <span
                className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                aria-label={`未読 ${unreadAnnouncements}件`}
              >
                {unreadAnnouncements}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );

  const accountFooter = (
    <div className="shrink-0 px-4 py-4 border-t border-blue-800 bg-blue-900">
      <div className="text-xs text-blue-200 font-medium truncate mb-0.5">
        {session?.user?.name}
      </div>

      <div className="text-xs text-blue-400 truncate mb-3">
        {session?.user?.email}
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full rounded-lg border border-blue-700 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-blue-800 hover:text-white transition-colors"
      >
        ログアウト
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 md:flex">

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-blue-900 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/cami-logo.png"
            alt="Cami"
            width={70}
            height={28}
            className="object-contain brightness-0 invert h-auto"
          />

          <span className="text-xs text-blue-200 truncate">
            店舗
          </span>
        </div>

        <button
          type="button"
          aria-label={
            mobileMenuOpen
              ? "メニューを閉じる"
              : "メニューを開く"
          }
          aria-expanded={mobileMenuOpen}
          aria-controls="member-mobile-navigation"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-700 text-white"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {mobileMenuOpen ? "×" : "☰"}
          </span>
        </button>
      </header>


      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside
            id="member-mobile-navigation"
            className="relative z-10 h-full w-72 max-w-[85vw] bg-blue-900 text-white flex flex-col shadow-xl"
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-blue-800">
              <div>
                <Image
                  src="/cami-logo.png"
                  alt="Cami"
                  width={80}
                  height={32}
                  className="object-contain brightness-0 invert h-auto"
                />

                <div className="text-blue-300 text-xs mt-1">
                  受発注システム（店舗）
                </div>
              </div>

              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 w-10 rounded-lg text-xl text-blue-100 hover:bg-blue-800"
              >
                ×
              </button>
            </div>

            <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3">
              {navContent}
            </nav>

            {accountFooter}
          </aside>
        </div>
      )}


      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:h-screen md:sticky md:top-0 bg-blue-900 text-white flex-col shrink-0 overflow-hidden">
        <div className="shrink-0 px-6 py-5 border-b border-blue-800">
          <Image
            src="/cami-logo.png"
            alt="Cami"
            width={90}
            height={36}
            className="object-contain brightness-0 invert mb-1 h-auto"
          />

          <div className="text-blue-300 text-xs mt-0.5">
            受発注システム（店舗）
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3">
          {navContent}
        </nav>

        {accountFooter}
      </aside>


      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 min-w-0 p-4 md:p-8">
          <NotificationBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
