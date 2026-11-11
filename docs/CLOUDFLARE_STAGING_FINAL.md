# Cloudflare Staging 最終検証結果

検証日: 2026-08-31  
対象Branch: `staging`  
対象Commit: `02b260d`  
Worker: `cami-order-system-staging`  
URL: `https://cami-order-system-staging.cami-order-system.workers.dev`

## 総合判定

**GO**

Cami受発注システムのCloudflare Workers staging環境について、
主要業務機能およびCloudflare固有ランタイムの実機確認を完了した。

## 合格項目

- Cloudflare Worker Health / Readiness
- Neon PostgreSQL接続
- Auth.js Credentials認証
- superadmin / editor / viewer / member
- RBAC
- 商品
- 在庫
- 加盟店
- 注文
- 注文履歴
- 注文詳細
- 注文CSV
- 納品書ページ
- 注文単位請求書
- 月次請求書
- 管理者請求書
- 加盟店請求書
- Audit Log（注文操作）
- F-01 同時二重送信防止
- 在庫atomic減算
- 認証済み同時DBアクセス
- Duplicate providers警告解消
- Worker gzipサイズ Free枠内
- Upload未設定時の安全停止

## F-01実機結果

対象注文:

- Order No: `ORD-20260831-8633`
- Order ID: `82187a2b-95ee-416e-8882-90baa698bc9c`

同一PayloadをCloudflare Workerへ同時に2リクエスト送信。

結果:

- HTTP 201 / 201
- 両レスポンスは同一Order ID
- DB増加: 1注文のみ
- 在庫減少: 1箱のみ

F-01: **PASS**

## 月次請求書

検証Invoice ID:

`67f0ef61-9c5f-4d26-8472-8761512e9afe`

- 作成: PASS
- 管理者API: PASS
- 管理者画面: PASS
- 加盟店API: PASS
- 加盟店画面: PASS
- 対象注文紐付け: PASS

## Upload

Cloudflare stagingでは画像ストレージを意図的に無効化している。

認証済み:

`503 STORAGE_NOT_CONFIGURED`

未認証:

`401/403`

現在:

- R2: 未契約
- Vercel Blob Token: 未設定
- Local fallback: 維持
- Cloudflare filesystem fallback: 禁止

これは既知制約であり、現在の設計どおり。

## Email

staging Workerには `RESEND_API_KEY` を設定していない。

実メール送信: **無効**

## Known Issues / Follow-up

### 1. 画像ストレージ

本番開始前に方式を決定する。

現状のままではCloudflare上の画像Uploadは利用不可。

### 2. Monthly Invoice Audit

月次請求書作成時の `monthly_invoice` Audit Log登録は
現行実装では確認できない。

Cloudflare移行障害ではなく、別品質課題として扱う。

### 3. OpenNext Middleware Warning

OpenNext build時にNode.js middlewareのCloudflare対応が
experimentalという警告が出る。

staging実機E2Eでは認証・RBAC・同時アクセスを含め正常動作を確認済み。

### 4. Tooling Deprecation Warning

Node.js `DEP0190` がOpenNext/Wrangler実行時に表示される。

アプリケーション動作の失敗は確認されていない。

## Production判定

Cloudflare staging: **GO**

Production cutover: **HOLD**

本番切替前の残件:

1. 画像ストレージ方針決定
2. Production環境変数設定
3. Production Neon DB確認
4. 独自ドメイン決定
5. DNS / Custom Domain設定
6. Production Smoke / E2E
7. Rollback手順準備

