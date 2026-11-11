import { notFound } from "next/navigation";
import ManualArticlePage from "@/components/help/ManualArticlePage";
import { findManualArticle } from "@/lib/manual";

export default async function AdminHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const article = findManualArticle("admin", (await params).slug);
  if (!article) notFound();
  return <ManualArticlePage role="admin" article={article} />;
}
