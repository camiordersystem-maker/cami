import { NextResponse } from "next/server";
import { forbidden, unauthorized } from "@/lib/api-response";

type Session = { user: { role?: string; adminRole?: string } } | null;

export function requireAdmin(session: Session): NextResponse | null {
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return unauthorized();
  }
  return null;
}

export function requireEditor(session: Session): NextResponse | null {
  const adminErr = requireAdmin(session);
  if (adminErr) return adminErr;
  const adminRole = (session!.user as { adminRole?: string }).adminRole;
  if (adminRole === "viewer") {
    return forbidden();
  }
  return null;
}

export function requireSuperAdmin(session: Session): NextResponse | null {
  const adminErr = requireAdmin(session);
  if (adminErr) return adminErr;
  const adminRole = (session!.user as { adminRole?: string }).adminRole;
  if (adminRole !== "superadmin") {
    return forbidden();
  }
  return null;
}
