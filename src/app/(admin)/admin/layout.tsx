import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Server-side role guard for all /admin pages. The visual layout is the
// client component in (admin)/layout.tsx; this nested layout only enforces
// that the session belongs to an admin before any admin page renders.
export default async function AdminGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
