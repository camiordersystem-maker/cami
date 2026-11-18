import assert from "node:assert/strict";
import { adminManualArticles, memberManualArticles, searchManualArticles, findManualArticle } from "../manual";
import { getContextHelpHref } from "../manual-routes";
for (const articles of [adminManualArticles, memberManualArticles]) {
  assert.equal(new Set(articles.map((a) => a.slug)).size, articles.length);
  assert.ok(articles.every((a) => a.steps.length > 0));
  assert.equal(searchManualArticles(articles, "　 ").length, articles.length);
  for (const a of articles) {
    assert.equal(findManualArticle(a.role, a.slug), a);
    assert.ok(searchManualArticles(articles, a.title).includes(a));
    if(a.screenPath) assert.ok(a.screenPath.startsWith(a.role === "admin" ? "/admin/" : "/"));
  }
}
assert.ok(searchManualArticles(adminManualArticles, "ＬＩＮＥ").some((a) => a.slug === "admin-line-notifications"));
assert.ok(searchManualArticles(adminManualArticles, "在庫 理由").some((a) => a.slug === "admin-inventory"));
assert.equal(searchManualArticles(adminManualArticles, "___no_match___").length, 0);
assert.equal(searchManualArticles(adminManualArticles, "在庫", "トラブル・通知").every((a) => a.category === "トラブル・通知"), true);
assert.equal(searchManualArticles(memberManualArticles, "").some((a) => a.role === "admin"), false);
assert.equal(getContextHelpHref("admin", "/admin/inventory"), "/admin/help/admin-inventory");
assert.equal(getContextHelpHref("admin", "/admin/help/admin-incidents"), null);
const review = findManualArticle("admin", "admin-review");
assert.ok(review);
assert.equal(findManualArticle("member", "admin-review"), undefined);
assert.ok(review.steps.some((step) => step.body.includes("更新操作はできません")));
assert.ok(review.steps.some((step) => step.warning?.includes("個人情報") || step.warning?.includes("氏名・住所")));
assert.ok(review.steps.some((step) => step.note?.includes("実在庫が未登録")));
console.log("Manual search, role separation, article structure and context links: PASS");
