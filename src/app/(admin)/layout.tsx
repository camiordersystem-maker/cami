"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const baseNavItems = [
  { href: "/admin/dashboard", label: "ダッシュボード" },
  { href: "/admin/orders", label: "注文管理" },
  { href: "/admin/invoices", label: "請求書管理" },
  { href: "/admin/members", label: "会員管理" },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/inventory", label: "在庫管理" },
  { href: "/admin/ranks", label: "ランク管理" },
  { href: "/admin/terms", label: "約款管理" },
];

const superAdminNavItems = [
  { href: "/admin/administrators", label: "管理者設定" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const adminRole = (session?.user as { adminRole?: string })?.adminRole;
  const isSuperAdmin = adminRole === "superadmin";

  const navItems = isSuperAdmin ? [...baseNavItems, ...superAdminNavItems] : baseNavItems;

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0 min-h-screen">
        <div className="px-6 py-5 border-b border-slate-700">
          <Image src="/cami-logo.png" alt="Cami" width={90} height={36} className="object-contain brightness-0 invert mb-1" />
          <div className="text-slate-400 text-xs mt-0.5">管理システム（本部）</div>
        </div>

        <nav className="flex-1 py-4 px-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
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
        </nav>

        <div className="px-4 py-4 border-t border-slate-700">
          <div className="text-xs text-slate-300 font-medium truncate mb-0.5">
            {session?.user?.name}
          </div>
          <div className="text-xs text-slate-500 truncate mb-1">
            {session?.user?.email}
          </div>
          {adminRole && (
            <div className="text-xs text-slate-600 mb-3">
              {adminRole === "superadmin" ? "スーパー管理者" : adminRole === "editor" ? "編集者" : "閲覧者"}
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ログアウト
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
