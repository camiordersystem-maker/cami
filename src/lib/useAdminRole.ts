"use client";

import { useSession } from "next-auth/react";

// viewerロールは更新系APIをHTTP 403で拒否される。
// isViewerを見て、実行しても弾かれるだけの更新系ボタンをUI側でも隠す。
//
// useSession()の初期状態ではsession/adminRoleがまだundefinedなので、
// 「isViewer = adminRole === "viewer"」だけで判定するとセッション読込中は
// 常にfalse（＝viewerではない扱い）になり、実際はviewerのユーザーにも
// 一瞬だけ更新系ボタンが見えてしまう（fail-open）。
// 権限が確定するまでは安全側に倒し、読込中もviewer相当として扱う（fail-closed）。
export function useAdminRole() {
  const { data: session, status } = useSession();
  const isSessionLoading = status === "loading";
  const adminRole = (session?.user as { adminRole?: string } | undefined)?.adminRole;
  return {
    adminRole,
    isViewer: isSessionLoading || adminRole === "viewer",
    isSuperAdmin: adminRole === "superadmin",
    isSessionLoading,
  };
}
