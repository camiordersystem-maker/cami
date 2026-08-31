# Cloudflare Production Migration Runbook

## 重要

このRunbookを作成した時点では、
Production切替はまだ実施しない。

stagingで検証済みの構成をProductionへ展開する際の手順書。

---

# Phase 0 - GO / NO-GO

以下をすべて満たすまでProductionへ進まない。

- [ ] staging最終判定 GO
- [ ] staging Branch clean
- [ ] mainへ反映する変更内容レビュー完了
- [ ] Production Neon DB確定
- [ ] Production Secrets準備
- [ ] 独自ドメイン確定
- [ ] Upload方針確定
- [ ] Email方針確定
- [ ] Rollback担当・方法確定

---

# Phase 1 - Production DB

## 1. Production Neon確認

staging DBとは別のProduction DBを使用する。

確認項目:

- Host
- Database
- Migration状態
- Schema
- Admin
- Products
- Inventory
- Members

Production DBへstagingテストデータをそのまま投入しない。

## 2. Backup

Production切替前にバックアップ/復元方法を確認する。

---

# Phase 2 - Production Worker

staging Worker:

`cami-order-system-staging`

Production Workerは別名で作成する。

例:

`cami-order-system`

staging WorkerをProduction用に上書きしない。

---

# Phase 3 - Secrets

Production Workerへ設定:

- DATABASE_URL
- AUTH_SECRET
- NEXTAUTH_SECRET

URL確定後:

- AUTH_URL
- NEXTAUTH_URL

Email利用時のみ:

- RESEND_API_KEY

値はターミナルへechoしない。

---

# Phase 4 - Vars

設定:

- APP_ENV=production
- RUNTIME_TARGET=cloudflare-workers
- NEXT_PUBLIC_APP_ENV=production
- NEXT_PUBLIC_SITE_URL=https://<production-domain>

必要に応じて:

- RESEND_FROM
- ADMIN_EMAIL
- NEXT_PUBLIC_SITE_NAME
- NEXT_PUBLIC_SUPPORT_EMAIL
- LOW_STOCK_THRESHOLD

---

# Phase 5 - Build

実施:

1. TypeScript
2. Next.js/OpenNext build
3. Duplicate providers警告が0件
4. Bundle size確認
5. R2 bindingがないことを確認
6. 意図しないrouteがないことを確認

Build失敗時はProduction deployしない。

---

# Phase 6 - First Production Deploy

最初は独自ドメインを切り替える前に
Production Workerへdeployする。

workers.dev URLで先にSmoke Testする。

確認:

- /login
- /api/health
- /api/readiness
- /api/auth/session

---

# Phase 7 - Authentication

Productionテストアカウントで確認:

- superadmin
- editor
- viewer
- member

RBAC:

- superadmin feature-flags = 200
- editor feature-flags = 403
- viewer feature-flags = 403
- superadmin audit-logs = 200
- editor audit-logs = 403
- viewer audit-logs = 403

---

# Phase 8 - Business E2E

Productionで破壊的テストを行う場合は、
専用のテスト加盟店・商品・在庫を準備する。

最低確認:

- 商品
- 在庫
- 加盟店
- 注文
- 注文詳細
- CSV
- 納品書
- 請求書
- RBAC
- Audit

F-01についてはstagingで実機PASS済み。

Productionで同じ二重注文試験を行う場合は
必ずテスト専用データを使用する。

---

# Phase 9 - Upload

画像ストレージ未決定の場合:

Production Uploadは
`503 STORAGE_NOT_CONFIGURED`

の状態を維持する。

画像Uploadが必須機能なら、
ストレージ決定前にProduction公開しない。

---

# Phase 10 - Email

Productionメールを有効にする直前まで
RESEND_API_KEYを設定しない選択も可能。

有効化後はまず内部テスト受信先で確認する。

確認:

- From
- To
- 注文メール
- 承認メール
- 請求書メール
- 低在庫
- 支払期限

大量配信を最初から行わない。

---

# Phase 11 - Custom Domain

workers.dev上のProduction確認後に設定する。

手順:

1. Cloudflare Custom Domain設定
2. DNS確認
3. TLS確認
4. AUTH_URL更新
5. NEXTAUTH_URL更新
6. NEXT_PUBLIC_SITE_URL更新
7. 再deploy
8. Login確認
9. Cookie確認
10. E2E再確認

staging domainを変更しない。

---

# Phase 12 - Cutover

Custom DomainでProduction E2E合格後に実施。

切替直後:

- Health
- Readiness
- Login
- Order list
- Product list
- Inventory
- Invoice
- Cloudflare logs

を確認する。

---

# Phase 13 - Vercel

Cloudflare Productionが安定するまで、
既存Vercel Productionを即削除しない。

旧Vercel環境をRollback候補として一定期間保持する。

ただし既存Vercel契約・商用利用条件に抵触しない形で
保持方法を最終判断する。

---

# Rollback

以下の場合はCloudflare本番公開を戻す。

- Login不能
- DB接続不能
- 注文不能
- 在庫不整合
- 重複注文
- RBAC異常
- 重大な500
- 認証Cookie異常

Rollback時:

1. DNS / Domain routingを旧安定環境へ戻す
2. Production Worker変更を停止
3. DBに書き込みが発生している場合はデータ整合性を確認
4. Cloudflare logs保存
5. 原因調査
6. 再切替はE2E合格後

DBを安易に巻き戻さない。

---

# Production完了条件

- [ ] Production Worker正常
- [ ] Production DB正常
- [ ] Login正常
- [ ] RBAC正常
- [ ] Order正常
- [ ] Inventory正常
- [ ] Invoice正常
- [ ] CSV正常
- [ ] Email方針確定
- [ ] Upload方針確定
- [ ] Custom Domain正常
- [ ] Rollback確認済み
- [ ] Logs確認済み

すべて満たした時点でProduction Cutover完了とする。

