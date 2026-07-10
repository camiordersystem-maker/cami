import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Server-side role guard for all member pages. The visual layout is the
// client component in (member)/layout.tsx; this template enforces that the
// session belongs to a member before any member page renders.
export default async function MemberGuardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "member") {
    redirect("/admin/dashboard");
  }
  return <>{children}</>;
}
