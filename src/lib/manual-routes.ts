import type { ManualRole } from "@/lib/manual";

export function getContextHelpHref(role: ManualRole, pathname: string): string | null {
  if (pathname.startsWith("/help") || pathname.startsWith("/admin/help")) return null;

  if (role === "member") {
    if (pathname === "/dashboard" || pathname === "/") return "/help/getting-started";
    if (pathname.startsWith("/products")) return "/help/place-order";
    if (/^\/orders\/[^/]+\/invoice/.test(pathname) || pathname.startsWith("/invoices")) return "/help/invoices";
    if (/^\/orders\/[^/]+/.test(pathname)) return "/help/order-history";
    if (pathname.startsWith("/orders")) return "/help/order-history";
    if (pathname.startsWith("/addresses")) return "/help/addresses";
    if (pathname.startsWith("/announcements")) return "/help/announcements";
    if (pathname.startsWith("/terms")) return "/help/terms";
    if (pathname.startsWith("/account")) return "/help/account";
    return "/help";
  }

  if (pathname === "/admin/dashboard") return "/admin/help/admin-overview";
  if (pathname.startsWith("/admin/orders")) return "/admin/help/admin-orders";
  if (pathname.startsWith("/admin/invoices")) return "/admin/help/admin-invoices";
  if (pathname.startsWith("/admin/members")) return "/admin/help/admin-members";
  if (pathname.startsWith("/admin/products")) return "/admin/help/admin-products";
  if (pathname.startsWith("/admin/inventory")) return "/admin/help/admin-inventory";
  if (pathname.startsWith("/admin/ranks")) return "/admin/help/admin-ranks";
  if (pathname.startsWith("/admin/terms")) return "/admin/help/admin-terms";
  if (pathname.startsWith("/admin/announcements")) return "/admin/help/admin-announcements";
  if (pathname.startsWith("/admin/administrators")) return "/admin/help/admin-administrators";
  if (pathname.startsWith("/admin/settings")) return "/admin/help/admin-settings";
  if (pathname.startsWith("/admin/feature-flags")) return "/admin/help/admin-feature-flags";
  if (pathname.startsWith("/admin/audit-logs")) return "/admin/help/admin-audit-logs";
  return "/admin/help";
}
