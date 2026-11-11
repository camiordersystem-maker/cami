# Environments and Release

## 1. 環境

### Local

開発・検証用。SQLite fallbackまたはDocker PostgreSQLを利用できる構成です。

Production credentialをローカル開発用コマンドへ混ぜないこと。

### STAGING

本番前検証専用。ProductionとはWorker / DB / LINE等を分離します。

UI上ではSTAGINGであることを示すバナーを表示します。

### Production

Cloudflare Workers + Neon PostgreSQL。

RC2 production application release baseline:

- Approved source SHA: `dcde0d0ce4dea0a4b17f4204a4556ee14a2c849c`
- Current public entrypoint at release completion: `https://cami-order-system-production.cami-order-system.workers.dev`
- Custom domain cutover: separate/deferred operation

※ Worker version ID等のリリース証跡はリリースReviewPack側で管理し、本ドキュメントには秘密情報を置きません。

## 2. Production safety boundary

Productionの次の操作は、通常の開発タスクへ含めません。

- Worker deploy
- DB write / migration
- DNS / custom domain
- LINE設定変更
- paid service変更

実行する場合は対象・範囲・rollbackを明確にし、明示承認を得ます。

## 3. Release rule

リリース対象SHAを固定します。

基本:

1. Git guard / clean worktree
2. exact SHA clean build
3. rollback target保存
4. migration要否確認
5. Production Worker deploy
6. health / readiness / login
7. auth / RBAC
8. business read-only smoke
9. DB post-release read-only sanity
10. Cloudflare / LINE / optional feature確認
11. secret-free evidence作成

詳細は既存の`PRODUCTION_RELEASE.md`、`CLOUDFLARE_PRODUCTION_RUNBOOK.md`を参照してください。

## 4. Rollback

Application-only releaseでDB変更がない場合、Worker version rollbackを第一候補とし、安易にDB restoreを行いません。

詳細: `ROLLBACK.md`

## 5. Domain

Application releaseとDNS/custom domain cutoverは分離します。

独自ドメイン切替では最低限:

- candidate domain確認
- Cloudflare DNS
- custom domain route
- TLS
- `NEXT_PUBLIC_SITE_URL` / auth URL
- LINE通知内URL
- redirect/canonical方針
- cutover後smoke
- rollback

を別工程で確認します。
