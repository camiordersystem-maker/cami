# Cami Documentation Index

Baseline: RC2 `dcde0d0ce4dea0a4b17f4204a4556ee14a2c849c`

この`docs/`はCami受発注システムの保守・運用・引き継ぎ用ドキュメント入口です。コードを最終的なsource of truthとしつつ、人が業務・権限・データ・リリースを把握できるように整理しています。

## 最初に読む

| 文書 | 用途 |
|---|---|
| `SYSTEM_OVERVIEW.md` | システムの目的・主要機能・全体像 |
| `ARCHITECTURE.md` | Next.js / Auth.js / DB / Cloudflare / Neon構成 |
| `FUNCTIONAL_SPEC.md` | 機能要件・主要業務機能一覧 |
| `SCREEN_SPEC.md` | 画面一覧・目的・主要操作 |
| `BUSINESS_FLOWS.md` | 会員申請→注文→出荷→請求→キャンセル等の業務フロー |
| `ROLES_AND_PERMISSIONS.md` | member / admin / superadmin / editor / viewerの権限 |
| `DATA_MODEL.md` | DBの考え方・主要テーブル・整合性ルール |
| `API_SPEC.md` | API設計、認証、レスポンス、主要エンドポイント |
| `INTEGRATIONS.md` | LINE / メール / 画像ストレージ等の外部連携 |
| `SECURITY_AND_NONFUNCTIONAL.md` | 認証・認可・セキュリティ・非機能baseline |
| `ENVIRONMENTS_AND_RELEASE.md` | Local / STAGING / Production とリリース境界 |
| `MANUAL_MAINTENANCE.md` | システム内マニュアルと画面キャプチャの更新方法 |
| `DOCUMENTATION_POLICY.md` | 改修時に仕様書・マニュアルを古くしない運用ルール |

## 自動生成資料

`docs/generated/`はコードから再生成する資料です。手修正せず、以下で更新します。

```bash
npm run docs:generate
```

- `generated/ROUTES.md` — 画面ルート一覧
- `generated/API_INVENTORY.md` — API一覧と概略権限
- `generated/DATABASE_SCHEMA.md` — PostgreSQL Drizzleスキーマ一覧
- `generated/MIGRATIONS.md` — PostgreSQL migration一覧とSHA-256

## 利用者向けマニュアル

利用者向け正式マニュアルはシステム内に実装されています。

- 店舗: `/help`
- 本部: `/admin/help`
- 各主要画面: `？ この画面の使い方`

マニュアル本文のsource of truthは`src/lib/manual.ts`です。画面キャプチャはSTAGINGから自動取得でき、`public/manual/screenshots/`に保存します。

## 既存の詳細運用資料

以下の既存資料も引き続き利用します。

- `OPERATIONS.md`
- `PRODUCTION_RELEASE.md`
- `ROLLBACK.md`
- `INCIDENT_RESPONSE.md`
- `STAGING.md`
- `CLOUDFLARE_PRODUCTION_RUNBOOK.md`
- `CLOUDFLARE_PRODUCTION_ENV.md`

古い日付・旧Vercel前提・旧ブランチ名を含む引き継ぎ資料は履歴資料として扱い、現在状態の判断にはRC2コードと本インデックス配下の現行資料を優先してください。
