<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Camiオイル受発注システム — 完全索引

Camiオイルの会員（サロン）向けBtoB受発注システム。**これが現行**（`~/cami-order` のTurborepo版は旧版・触らない）。
この索引は正確（2026-07-12全数調査）。ここに書いてあるファイルの場所・役割は再探索不要。

- スタック: Next.js 16.2.10（webpack, App Router, `params`はPromise）/ TypeScript / Tailwind / Drizzle ORM / NextAuth v5(JWT) / Resend / zod
- DB三態: 本番=Neon PG(neon-serverless Pool) / ローカルDocker PG(port 54329, `pg`) / フォールバック=SQLite `local.db`（.env.localにDATABASE_URLなし時）
- コマンド: `npm run dev`(:3000) / `typecheck` / `lint` / `test` / `build` / `seed` / `db:migrate`(SQLite) / `db:migrate:pg` / `local:setup`(Docker一式)
- デプロイ: GitHub `camiordersystem-maker/cami`（★shimacraft8とは別アカウント）→ Vercel自動デプロイ。`vercel-build` = **migrate.pg.ts実行→next build**（migrateを外すと本番即死。seedは絶対入れない）
- Node **22.x固定**（engines。neon-serverlessがネイティブWebSocket必須）
- テストアカウント: 管理者 `admin@cami.co.jp` / 会員 `test-salon@example.com`（PWは `~/Documents/Cami受発注システム_ログイン情報_秘密.txt`）
- 操作ガイド: `docs/CAMI_BEGINNER_ACCESS_GUIDE.md` / 画面設計: `docs/画面設計書.html`

## キーワード→即引き表（プロンプトの用語からここで一発特定）

| 言葉 | 見るファイル |
|---|---|
| ログイン・認証・レート制限 | `src/auth.ts`（Credentials+10回/15分制限）, `src/auth.config.ts`（JWT callbacks）, `src/lib/rate-limit.ts` |
| ログイン後のリダイレクト | `src/app/page.tsx`（role別振り分け）, `src/app/login/page.tsx` |
| 画面アクセス制御・ロールガード | `src/proxy.ts`（Cookie有無+セキュリティヘッダ+PUBLIC_PATHS）, `src/app/(admin)/admin/layout.tsx`（admin必須）, `src/app/(member)/template.tsx`（member必須） |
| 管理者権限 superadmin/editor/viewer | `src/lib/admin-auth.ts`（requireAdmin/Editor/SuperAdmin）。viewer=読取のみ, administrators管理=superadminのみ |
| 注文作成・発注 | API: `src/app/api/orders/route.ts`（配送先所有権検証・約款同意チェック・在庫引当tx・orderNo衝突リトライ）/ UI: `src/app/(member)/products/page.tsx` |
| 注文ステータス遷移 | `src/lib/order-status.ts`（遷移表・追跡番号/理由の必須判定）。pending→confirmed→shipped→delivered, キャンセル系はcancel_requested経由 |
| 注文の確定・発送・配達（管理者） | API: `src/app/api/admin/orders/[id]/route.ts`（PATCH, tx+楽観ロック+通知発行）/ UI: `src/app/(admin)/admin/orders/[id]/page.tsx` |
| キャンセル申請（会員） | `src/app/api/orders/[id]/cancel-request/route.ts`（楽観ロック）/ UI: `src/app/(member)/orders/[id]/page.tsx` |
| キャンセル承認/却下（管理者） | `src/app/api/admin/orders/[id]/cancel-approve/route.ts`（tx・在庫返却）, `cancel-reject/route.ts`（楽観ロック・元status復元） |
| 注文一覧・フィルタ・検索（管理者） | `src/app/(admin)/admin/orders/page.tsx`（server, URLパラメータ）+ `OrdersFilter.tsx`（client UI） |
| 在庫・入庫・在庫調整 | API: `src/app/api/admin/inventory/route.ts`(PUT,理由必須) + `inventory/list` + `inventory/receipts` + `inventory-warnings` / UI: `src/app/(admin)/admin/inventory/page.tsx` |
| 在庫移動履歴・台帳 | DBテーブル `inventory_movements`（initial/inbound/order_allocation/cancellation_return/manual_adjustment）。UIなし・SQLで確認 |
| 低在庫アラート・閾値 | `src/lib/constants.ts`(INVENTORY_WARNING_THRESHOLD=10) / ダッシュボード表示: `src/app/(admin)/admin/dashboard/page.tsx` / メール: `src/lib/email.ts` sendLowStockAlert |
| 商品管理・商品画像 | `src/app/api/admin/products/route.ts` + `[id]` + `list` / 画像: `src/app/api/admin/upload/route.ts`（editor必須, Vercel Blob or public/uploads）/ UI: `admin/products/page.tsx` |
| 会員（サロン）管理・承認・却下 | `src/app/api/admin/members/[id]/route.ts`（PATCH status→メール送信）/ UI: `admin/members/page.tsx`, `[id]/page.tsx`, `new/page.tsx` |
| 会員登録申請 | `src/app/api/register/route.ts`（IP別レート制限5回/h）/ UI: `src/app/register/page.tsx` |
| ランク・掛け率 | `src/app/api/admin/ranks/route.ts` / UI: `admin/ranks/page.tsx`。スタンダード50%〜プラチナ35%, 単価=定価×本数×rate |
| 金額計算・消費税・送料 | `src/lib/constants.ts`(TAX_RATE=0.10) 計算はorders POST内。送料=別途表記のみ（shippingFee列は現状0） |
| 約款・利用規約・同意 | 管理: `src/app/api/admin/terms/route.ts`（公開後は新draft版作成）/ 同意: `src/app/api/terms/consent/route.ts` / UI: `(member)/terms/` + `TermsConsentButton.tsx`, `admin/terms/page.tsx`。未同意だと注文409 |
| 請求書・月次請求・入金 | `src/app/api/admin/invoices/route.ts`（月次集計生成）+ `[id]`（PATCH: paymentStatus enum検証・paid時に通知）/ UI: `admin/invoices/` 。**PDF/メール/入金WFは未実装**（システム外運用） |
| 会員向け請求書表示・印刷 | `src/app/(member)/orders/[id]/invoice/page.tsx` + `PrintButton.tsx` / 納品書: `admin/orders/[id]/delivery-note/page.tsx` |
| お知らせ（管理者→店舗） | 管理: `src/app/api/admin/announcements/route.ts` + `[id]`(DELETE) / 会員: `src/app/api/announcements/route.ts` + `[id]/read` / UI: `admin/announcements/page.tsx`, `(member)/announcements/page.tsx`。all/individual・有効期限・未読バッジ（(member)/layout.tsxで取得） |
| 通知バナー（注文確認/発送/請求） | `src/app/api/notifications/route.ts` + `[id]/read` / UI: `src/components/member/NotificationBanner.tsx`。発行箇所: admin orders PATCH と invoices PATCH |
| 配送先住所 | `src/app/api/addresses/route.ts` + `[id]`（所有権スコープ・ソフトデリート）/ UI: `(member)/addresses/page.tsx` |
| パスワード変更（会員） | `src/app/api/member/password/route.ts` / UI: `(member)/account/page.tsx` |
| 管理者アカウント管理 | `src/app/api/admin/administrators/route.ts`（superadmin専用。自己無効化・自己降格ブロック）/ UI: `admin/administrators/page.tsx` |
| システム設定・振込先 | `src/app/api/admin/settings/route.ts`, `src/app/api/settings/route.ts`（会員向け読取）/ UI: `admin/settings/page.tsx` |
| CSVエクスポート | `src/app/api/admin/export/{orders,members,inventory}/route.ts` |
| メール送信・文面 | `src/lib/email.ts`（注文確認/承認/却下/新規申請/低在庫。esc()でHTMLエスケープ。dev=console, staging=suppress/redirect） |
| 監視・死活 | `/api/health`（無認証）, `/api/readiness`（無認証・DB疎通。PG=execute/SQLite=run両対応） |
| 監査ログ・変更履歴 | DBテーブル `audit_logs`。閲覧: `src/app/api/admin/audit-logs/route.ts`(superadmin限定・フィルタ+ページング+actor名解決) + UI `admin/audit-logs/page.tsx`。ラベルは`constants.ts`のAUDIT_ACTION_LABEL/AUDIT_TARGET_TYPE_LABEL。新しい書込操作を追加したら必ずラベルも追加。会員/注文/管理者の各詳細ページに`?targetType=&targetId=`深リンクあり |
| 機能フラグ | DBテーブル `feature_flags`（デフォルト全OFF）。API: `src/app/api/admin/feature-flags/route.ts`(superadmin限定toggle) + `src/app/api/feature-flags/route.ts`(全ロール読取専用)。ヘルパー: `src/lib/feature-flags.ts`(isFeatureEnabled/getFeatureFlagMap)。UI: `admin/feature-flags/page.tsx`。新機能を追加する時は`constants.ts`のFEATURE_FLAGSに追記+PG/SQLite両migrationにINSERT文追加 |
| ステータス履歴 | DBテーブル `order_status_histories`（全遷移を記録） |
| APIレスポンス形式 | `src/lib/api-response.ts`（`{ok,data}`/`{ok:false,error:{code,message}}`）。旧形式`{error:string}`のルートも残存 → クライアントは必ず `src/lib/client-api.ts` の `apiErrorMessage()`/`apiData()` を使う |
| 定数・ラベル・色 | `src/lib/constants.ts`（税率・閾値・通知タイプ）, `src/lib/utils.ts`（ORDER_STATUS_LABEL/COLOR, 金額fmt, orderNo/invoiceNo生成） |
| 環境変数ガード | `src/lib/env.ts`（本番SQLite禁止・PG URL検証）, `src/lib/db/index.ts`（三態接続の分岐） |

## DBテーブル（スキーマは schema-pg.ts=本番 / schema-sqlite.ts=ローカル の2枚。**必ず両方更新**）

member_ranks / members / admins(role列) / shipping_addresses(soft delete) / products / inventory / inventory_receipts / orders(status: pending,confirmed,shipped,delivered,cancelled,cancel_requested) / order_items / monthly_invoices / audit_logs / terms(version管理) / system_settings / notifications / announcements / announcement_reads / inventory_movements / order_status_histories / member_terms_consents / password_reset_tokens(未使用) / invoices・invoice_items・payments(スキーマのみ・UI未実装) / feature_flags(key text PK, enabled bool, 全機能デフォルトOFF)

**マイグレーション追加手順（二重登録が必須・忘れると片方で動かない）**:
1. PG: `src/lib/db/migrations/pg/00XX_*.sql` を作成 → `src/lib/db/migrate.pg.ts` の `EXTRA_MIGRATIONS` 配列に追記
2. SQLite: `src/lib/db/migrations/sqlite/00XX_*.sql` を作成 → `migrations/sqlite/meta/_journal.json` にエントリ追記
3. `src/lib/db/schema-pg.ts` と `schema-sqlite.ts` の両方に列/テーブル定義を追加（`schema.ts`のre-exportも）

## 実装規約（このリポジトリの流儀）

- 動的ルートの `params` は `Promise<{id:string}>`（Next16）。`(await params).id`
- 書込系は PG時 `db.transaction()` / SQLite時直接実行の `run()` パターン（orders POST等を踏襲）
- ステータス更新は必ず楽観ロック（`WHERE id AND status=旧status` + `.returning()` 件数チェック → 0件なら409）
- 在庫増減時は `inventory_movements` に before/after を記録、遷移時は `order_status_histories` に記録
- 管理API冒頭: `requireEditor(session)`（書込）or role==="admin"チェック（読取）。administrators系のみ `requireSuperAdmin`
- ハードコード文字列は `src/lib/constants.ts` かデータファイルで管理。秘密情報は必ず環境変数
- クライアントのfetch結果処理は `apiErrorMessage(json, fallback)` / `apiData<T>(json)` 経由

## 落とし穴（過去に実害あり）

- `vercel-build` から `npx tsx src/lib/db/migrate.pg.ts` を消すと新テーブル未作成のまま本番デプロイされ全滅する
- seedを本番で実行しない（`ALLOW_PRODUCTION_SEED`ガードあり）。README上、本番リリースは操作者の明示指示が必要
- SQLiteのjournal未登録・PGのEXTRA_MIGRATIONS未登録は「エラーなく単に適用されない」
- `.env.local` は現状SQLiteモード（DATABASE_URLなし）。Docker PG検証時は `.env.local.example` を参照
- 削除済み: `schema.pg.ts`(旧残骸), `check-connection.ts`, `api/admin/orders/[id]/detail`。復活させない
- `git push`が403で失敗する場合、`gh auth status`でアクティブアカウントを確認（`gh auth switch --user shimacraft8`）。
  このrepoはcamiordersystem-maker所有だがshimacraft8がコラボレーターとしてpush可能。他プロジェクト作業でghのアクティブアカウントが切り替わることがある
- 管理者アカウントの作成/更新(`administrators` route)は当初audit_logsに未記録だった＝重大操作ほど記録漏れがないか個別に確認すること

## 仕様書・履歴

ルート直下: `Cami受発注システム_要件定義書.docx` / `設計書.docx` / `ManusAIテスト仕様書.md`。docs/: STAGING / OPERATIONS / PRODUCTION_RELEASE / ROLLBACK / INCIDENT_RESPONSE。
2026-07-10: 全網羅レビュー（ロールガード新設・楽観ロック・番号衝突リトライ・health公開等14件）済み。品質チェック一式 = `typecheck && lint && test && build`。
