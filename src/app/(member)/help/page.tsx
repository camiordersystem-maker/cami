import ManualIndex from "@/components/help/ManualIndex";
import { memberManualArticles } from "@/lib/manual";

export const metadata = { title: "ヘルプ・マニュアル" };

export default function MemberHelpPage() {
  return <ManualIndex role="member" articles={memberManualArticles} />;
}
