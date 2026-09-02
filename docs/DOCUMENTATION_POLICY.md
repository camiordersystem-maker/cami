# Documentation Policy

目的: 「コードは変わったが仕様書・マニュアルは昔のまま」を防ぐ。

## 1. Source of truth

優先順位:

1. 実装コード / migration / runtime config
2. 自動生成ドキュメント `docs/generated/`
3. curated仕様書 `docs/*.md`
4. 利用者マニュアル `src/lib/manual.ts`
5. 旧引き継ぎ資料・過去artifact

矛盾した場合は、現在のapproved source SHAを基準にコードを再確認します。

## 2. Definition of Done

機能追加・仕様変更・不具合修正時に必ず次を判定します。

```text
CODE=PASS
TEST=PASS
DOC_UPDATE=PASS/NOT_REQUIRED
MANUAL_UPDATE=PASS/NOT_REQUIRED
SCREENSHOT_UPDATE=PASS/NOT_REQUIRED
API_DOC_UPDATE=PASS/NOT_REQUIRED
DB_DOC_UPDATE=PASS/NOT_REQUIRED
```

`NOT_REQUIRED`の場合も理由をレビュー記録へ残します。

## 3. 変更別の更新対象

| 変更 | 最低限確認する資料 |
|---|---|
| 画面・文言・操作フロー | `src/lib/manual.ts`, screenshot, `SYSTEM_OVERVIEW/BUSINESS_FLOWS` |
| API追加・変更 | `API_SPEC.md`, `docs:generate` |
| DB変更 | `DATA_MODEL.md`, migrations, `docs:generate` |
| 権限変更 | `ROLES_AND_PERMISSIONS.md`, manual |
| 注文/在庫ロジック | `BUSINESS_FLOWS.md`, `DATA_MODEL.md`, manual |
| LINE/メール/外部連携 | `INTEGRATIONS.md`, operations/manual |
| deploy/env | `ENVIRONMENTS_AND_RELEASE.md`, runbook |

## 4. 自動生成

改修後:

```bash
npm run docs:generate
npm run docs:check
```

生成差分が出た場合は、API/route/schema変更を意図したものか確認します。

## 5. Manual screenshots

UI変更が主要マニュアル画面へ影響する場合:

```bash
npm run manual:capture
```

詳細は`MANUAL_MAINTENANCE.md`。

## 6. Commit rule

仕様変更に伴うコードとドキュメントは、可能な限り同一PR/同一release candidateで更新します。

「あとでマニュアルだけ直す」を標準運用にしません。

## 7. AI/Codex共通指示へ入れる文

```text
機能追加・仕様変更・不具合修正を行った場合、
docs/、src/lib/manual.ts、manual screenshot、API/DB generated docsへの影響を確認すること。
更新が必要なら同じ変更内で更新する。
不要ならDOC_UPDATE=NOT_REQUIREDと理由を記録する。
最後にnpm run docs:generate && npm run docs:checkを実行する。
```
