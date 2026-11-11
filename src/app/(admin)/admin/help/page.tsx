import ManualIndex from "@/components/help/ManualIndex";
import { adminManualArticles } from "@/lib/manual";

export const metadata = { title: "管理者ヘルプ・マニュアル" };

export default function AdminHelpPage() {
  return <ManualIndex role="admin" articles={adminManualArticles} />;
}
