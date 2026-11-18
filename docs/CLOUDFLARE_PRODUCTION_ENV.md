# Cloudflare Production 環境変数

> **Current-state note (2026-09-02 / RC2):** Production application entrypointは現在workers.devです。独自ドメインは別工程です。secret値は引き続き本書へ記録しません。

## 方針

Secret値そのものはGitへ保存しない。

Cloudflare本番Workerへ投入する値は、
本番切替時にCloudflare Secrets / Varsとして設定する。

---

## 必須 Secrets

### DATABASE_URL

Production Neon PostgreSQL接続URL。

**staging DATABASE_URLを絶対に使用しない。**

### AUTH_SECRET

Auth.js署名用Secret。

Production専用のランダム値を生成する。

### NEXTAUTH_SECRET

互換性維持のため設定。

`AUTH_SECRET` と同一値でもよいが、
現行運用に合わせて本番Workerへ明示設定する。

---

## 必須 URL / Vars

独自ドメイン決定後に確定する。

### AUTH_URL

例:

`https://<production-domain>`

### NEXTAUTH_URL

例:

`https://<production-domain>`

### NEXT_PUBLIC_SITE_URL

例:

`https://<production-domain>`

### APP_ENV

`production`

### NEXT_PUBLIC_APP_ENV

`production`

### RUNTIME_TARGET

`cloudflare-workers`

---

## Emailを本番で利用する場合

### RESEND_API_KEY

Resend Production API Key。

### RESEND_FROM

本番送信元。

DNS認証済みドメインを使用する。

### ADMIN_EMAIL

管理者通知先として現行コードから参照される。

---

## Staging専用

Productionでは設定しない。

- STAGING_EMAIL_MODE
- STAGING_EMAIL_TO

---

## Local専用

Productionでは設定しない。

- SQLITE_PATH

---

## Seed専用

通常のProduction Worker Runtimeには設定しない。

- ADMIN_PASSWORD
- ALLOW_PRODUCTION_SEED
- STAGING_DEFAULT_PASSWORD

本番管理者作成が必要な場合は、
本番Seed手順を別途明示的に実施する。

---

## Optional

コードの利用状況と運用要件に応じて設定。

- LOW_STOCK_THRESHOLD
- DATABASE_POOL_MAX
- DATABASE_POOL_IDLE_TIMEOUT_MS
- DATABASE_POOL_CONNECTION_TIMEOUT_MS
- NEXT_PUBLIC_SITE_NAME
- NEXT_PUBLIC_SUPPORT_EMAIL

---

## Upload

現時点:

- R2: 使用しない
- BLOB_READ_WRITE_TOKEN: 未設定
- Cloudflare upload: 503で安全停止

画像Uploadを本番で必要とする場合、
Production Cutover前に永続ストレージ方式を必ず決定する。

`BLOB_READ_WRITE_TOKEN` を設定する場合は、
Vercel Blobの契約・料金・商用利用条件を確認してから行う。

---

## Production投入禁止

stagingの以下の値をコピーしない。

- staging DATABASE_URL
- staging AUTH_SECRET
- staging NEXTAUTH_SECRET
- staging AUTH_URL
- staging NEXTAUTH_URL

Production専用値を使用すること。

