import { notFound } from "next/navigation";
import ManualArticlePage from "@/components/help/ManualArticlePage";
import { findManualArticle } from "@/lib/manual";

export default async function MemberHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const article = findManualArticle("member", (await params).slug);
  if (!article) notFound();
  return <ManualArticlePage role="member" article={article} />;
}
