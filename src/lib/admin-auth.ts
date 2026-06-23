import { NextResponse } from "next/server";

type Session = { user: { role?: string; adminRole?: string } } | null;

export function requireAdmin(session: Session): NextResponse | null {
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function requireEditor(session: Session): NextResponse | null {
  const adminErr = requireAdmin(session);
  if (adminErr) return adminErr;
  const adminRole = (session!.user as { adminRole?: string }).adminRole;
  if (adminRole === "viewer") {
    return NextResponse.json({ error: "閲覧者権限では変更できません" }, { status: 403 });
  }
  return null;
}

export function requireSuperAdmin(session: Session): NextResponse | null {
  const adminErr = requireAdmin(session);
  if (adminErr) return adminErr;
  const adminRole = (session!.user as { adminRole?: string }).adminRole;
  if (adminRole !== "superadmin") {
    return NextResponse.json({ error: "スーパー管理者のみ操作できます" }, { status: 403 });
  }
  return null;
}
