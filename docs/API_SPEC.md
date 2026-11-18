# API Specification

完全一覧: `generated/API_INVENTORY.md`

## 1. 基本

APIはNext.js App Router Route Handlersです。

配置:

`src/app/api/**/route.ts`

## 2. Authentication

- Auth.js Credentials sessionを利用。
- 公開APIを除き`auth()`でsessionを取得。
- member/admin roleをAPIで検証。
- admin writeは`requireEditor`、高権限は`requireSuperAdmin`を使用する箇所あり。

## 3. Public / special endpoints

代表例:

- `/api/auth/*` — Auth.js
- `/api/register` — 会員申請
- `/api/health` — health
- `/api/readiness` — DB readiness
- `/api/webhooks/line` — LINE署名認証

## 4. Cross-site mutation protection

`src/proxy.ts`でAPI mutationに対し`Sec-Fetch-Site`と`Origin`を確認します。

cross-site mutationは403です。

除外:

- Auth.js
- LINE webhook

ヘッダを持たない信頼済みserver-to-server clientとの互換性を残す実装です。

## 5. API response

新しい共通レスポンスは`src/lib/api-response.ts`を利用します。

成功概念:

```json
{
  "ok": true,
  "data": {}
}
```

エラー概念:

```json
{
  "ok": false,
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

旧routeには`{ "error": "..." }`形式も残っています。client codeは`src/lib/client-api.ts`のhelperを利用して両形式へ対応します。

## 6. 主なmember API

| API | 目的 |
|---|---|
| `/api/products` | 注文可能商品読取 |
| `/api/orders` | 自分の注文一覧 / 注文作成 |
| `/api/orders/[id]` | 注文詳細 |
| `/api/orders/[id]/cancel-request` | キャンセル申込 |
| `/api/orders/export` | 自分の注文CSV |
| `/api/addresses` | 配送先一覧 / 登録 |
| `/api/addresses/[id]` | 配送先更新 / 削除 |
| `/api/invoices/[id]` | 自分の請求書 |
| `/api/terms/consent` | 最新約款同意 |
| `/api/announcements` | お知らせ |
| `/api/notifications` | 通知 |
| `/api/member/password` | パスワード変更 |

## 7. 主なadmin API

| API | 目的 |
|---|---|
| `/api/admin/orders` | 注文一覧 |
| `/api/admin/orders/[id]` | 注文詳細 / 状態変更 |
| `/api/admin/orders/[id]/cancel-approve` | キャンセル承認 |
| `/api/admin/orders/[id]/cancel-reject` | キャンセル却下 |
| `/api/admin/invoices` | 月次請求書一覧 / 発行 |
| `/api/admin/invoices/[id]` | 請求書詳細 / 支払状態更新 |
| `/api/admin/invoices/[id]/send` | 請求書メール送付 |
| `/api/admin/members` | 会員一覧 / 作成 |
| `/api/admin/members/[id]` | 会員詳細 / 更新 |
| `/api/admin/products` | 商品一覧 / 作成 |
| `/api/admin/products/[id]` | 商品更新 |
| `/api/admin/inventory` | 在庫更新 |
| `/api/admin/ranks` | ランク管理 |
| `/api/admin/terms` | 約款管理 |
| `/api/admin/settings` | システム設定 |
| `/api/admin/announcements` | お知らせ管理 |
| `/api/admin/administrators` | 管理者管理 |
| `/api/admin/feature-flags` | 機能フラグ |
| `/api/admin/audit-logs` | 監査ログ |

## 8. Validation / concurrency

- zod validationを主要mutationで利用。
- 注文statusは遷移表で検証。
- concurrency-sensitiveなstatus更新は楽観ロックを利用する実装あり。
- 注文作成はProduction PostgreSQLでadvisory lock + duplicate detectionを持つ。

## 9. API追加時の必須確認

- 認証・role scope
- CSRF/cross-site境界
- zod validation
- DB transaction要否
- audit log
- status history / inventory movement要否
- API response helper
- docs / generated inventory / manual影響
