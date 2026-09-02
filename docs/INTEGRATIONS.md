# External Integrations

## 1. LINE Messaging API

### 目的

店舗の新規注文成立後、本部向けLINEグループへ新規注文通知をpushします。

### 主な環境変数名

- `LINE_ORDER_NOTIFICATIONS_ENABLED`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_ORDER_NOTIFICATION_GROUP_ID`
- `LINE_CHANNEL_SECRET`
- `LINE_GROUP_SETUP_TOKEN`（setup用途）

値はドキュメントへ記載しません。

### 注文通知

`src/lib/orders/post-commit-notifications.ts`から、DB transaction COMMIT後にメールとLINE通知を呼びます。

LINE失敗は成立済み注文をrollbackしません。

LINE client:

- 2.5秒default timeout
- 5xx retry 最大3 attempt
- `X-Line-Retry-Key`
- 429 / HTTP / timeout / network等を分類

### Webhook

`/api/webhooks/line`はraw bodyに対するHMAC SHA-256 `X-Line-Signature`を検証します。不正署名は401です。

## 2. Email / Resend

`src/lib/email.ts`

主な送信用途:

- 注文受付
- 会員承認 / 却下
- 本部への新規会員通知
- 低在庫通知
- 支払期限超過
- 請求書メール
- お知らせメール

### Environment behavior

- API key未設定またはdummy local値 → 開発扱い。実送信しない。
- STAGING → default suppress。redirect modeを設定した場合のみtest recipientへredirect。
- Production → 有効なResend設定がある場合に実送信。

メール本文のuser inputはHTML escapeします。

Productionでemailを無効運用している場合、機能フラグ/画面操作を含め誤送信しないよう運用してください。

## 3. Product image upload

`/api/admin/upload`

- editor以上
- JPEG / PNG / WebP / GIF
- 最大3MB
- extensionはMIME typeから決定

保存先:

1. `BLOB_READ_WRITE_TOKEN`がある場合: Vercel Blob
2. Cloudflare Workersで外部storage未設定: `503 STORAGE_NOT_CONFIGURED`
3. local: `public/uploads/`

Cloudflare ProductionでR2等を未設定の現在構成では、503は明示的な安全動作です。ストレージ追加時は別途設計・承認・費用確認を行います。

## 4. Neon PostgreSQL

Production PostgreSQLとして利用する構成です。DB URLやtokenをコード・ドキュメント・artifactへ記録しません。

Production DB操作では、release/監査手順に定めたread-only境界と明示承認を守ります。

## 5. Cloudflare Workers / OpenNext

- Application runtime: Cloudflare Workers
- Adapter: `@opennextjs/cloudflare`
- Static assets binding: `ASSETS`
- Worker config: `wrangler.jsonc`

STAGINGとProductionはWorker、DB、LINE、SITE URLを分離します。
