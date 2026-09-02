"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getContextHelpHref } from "@/lib/manual-routes";

const baseNavItems = [
  { href: "/admin/dashboard", label: "ダッシュボード" },
  { href: "/admin/orders", label: "注文管理" },
  { href: "/admin/invoices", label: "請求書管理" },
  { href: "/admin/members", label: "会員管理" },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/inventory", label: "在庫管理" },
  { href: "/admin/ranks", label: "ランク管理" },
  { href: "/admin/terms", label: "約款管理" },
  { href: "/admin/announcements", label: "お知らせ管理" },
  { href: "/admin/help", label: "ヘルプ・マニュアル" },
];

const superAdminNavItems = [
  { href: "/admin/administrators", label: "管理者設定" },
  { href: "/admin/settings", label: "システム設定" },
  { href: "/admin/feature-flags", label: "機能フラグ" },
  { href: "/admin/audit-logs", label: "監査ログ" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contextHelpHref = getContextHelpHref("admin", pathname);

  const adminRole =
    (session?.user as { adminRole?: string })?.adminRole;

  const isSuperAdmin = adminRole === "superadmin";

  const navItems = isSuperAdmin
    ? [...baseNavItems, ...superAdminNavItems]
    : baseNavItems;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navContent = (
    <>
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (
            item.href !== "/admin/dashboard" &&
            pathname.startsWith(item.href)
          );

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
              active
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );

  const accountFooter = (
    <div className="shrink-0 px-4 py-4 border-t border-slate-700 bg-slate-900">
      <div data-manual-mask className="text-xs text-slate-300 font-medium truncate mb-0.5">
        {session?.user?.name}
      </div>

      <div data-manual-mask className="text-xs text-slate-500 truncate mb-1">
        {session?.user?.email}
      </div>

      {adminRole && (
        <div className="text-xs text-slate-500 mb-3">
          {adminRole === "superadmin"
            ? "スーパー管理者"
            : adminRole === "editor"
              ? "編集者"
              : "閲覧者"}
        </div>
      )}

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
      >
        ログアウト
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 md:flex">

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/cami-logo.png"
            alt="Cami"
            width={70}
            height={28}
            className="object-contain brightness-0 invert h-auto"
          />

          <span className="text-xs text-slate-300 truncate">
            本部管理
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
          aria-controls="admin-mobile-navigation"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 text-white"
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
            id="admin-mobile-navigation"
            className="relative z-10 h-full w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col shadow-xl"
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <div>
                <Image
                  src="/cami-logo.png"
                  alt="Cami"
                  width={80}
                  height={32}
                  className="object-contain brightness-0 invert h-auto"
                />

                <div className="text-slate-400 text-xs mt-1">
                  管理システム（本部）
                </div>
              </div>

              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setMobileMenuOpen(false)}
                className="h-11 w-11 rounded-lg text-xl text-slate-200 hover:bg-slate-800"
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
      <aside
        className="hidden md:flex md:w-60 md:h-screen md:sticky md:top-0 bg-slate-900 text-white flex-col shrink-0 overflow-hidden"
        style={{
          height: "calc(100dvh - var(--cami-top-offset, 0px))",
          top: "var(--cami-top-offset, 0px)",
        }}
      >
        <div className="shrink-0 px-6 py-5 border-b border-slate-700">
          <Image
            src="/cami-logo.png"
            alt="Cami"
            width={90}
            height={36}
            className="object-contain brightness-0 invert mb-1 h-auto"
          />

          <div className="text-slate-400 text-xs mt-0.5">
            管理システム（本部）
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
          {contextHelpHref && (
            <div className="mb-3 flex justify-end">
              <Link
                href={contextHelpHref}
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                ？ この画面の使い方
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
