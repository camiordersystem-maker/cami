"use client";

import { useSession } from "next-auth/react";

// viewerロールは更新系APIをHTTP 403で拒否される。
// isViewerを見て、実行しても弾かれるだけの更新系ボタンをUI側でも隠す。
export function useAdminRole() {
  const { data: session, status } = useSession();
  const adminRole = (session?.user as { adminRole?: string } | undefined)?.adminRole;
  return {
    adminRole,
    isViewer: adminRole === "viewer",
    isSuperAdmin: adminRole === "superadmin",
    isSessionLoading: status === "loading",
  };
}
