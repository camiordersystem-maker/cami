# Architecture

Baseline: RC2 `dcde0d0ce4dea0a4b17f4204a4556ee14a2c849c`

## 1. Application

- Next.js 16 App Router
- TypeScript
- React 18
- Tailwind CSS 4
- Auth.js / NextAuth v5 Credentials Provider
- Drizzle ORM
- zod

Next.jsはwebpack buildを使用します。Cloudflare向けbundleは`@opennextjs/cloudflare`で作成します。

## 2. Runtime / Hosting

ProductionはCloudflare Workers + OpenNext構成です。

`wrangler.jsonc`の主な構成:

- Worker bundle: `.open-next/worker.js`
- Static assets: `.open-next/assets`
- `nodejs_compat`
- runtime marker: `RUNTIME_TARGET=cloudflare-workers`

STAGINGとProductionは別Workerとして運用し、DB・LINE・URL等も環境分離します。

## 3. Database

`src/lib/db/schema.ts`がruntime routerとして働きます。

- PostgreSQL URL → `schema-pg.ts`
- 非PostgreSQL / fallback → `schema-sqlite.ts`

ProductionはPostgreSQLを必須とし、`src/lib/env.ts`がProductionでSQLiteやAUTH_SECRET不足を拒否します。

Production DBはNeon PostgreSQLを利用する構成です。

### Schema source of truth

- Production: `src/lib/db/schema-pg.ts`
- SQLite: `src/lib/db/schema-sqlite.ts`
- 共通export: `src/lib/db/schema.ts`

DB変更時はPG/SQLite双方とmigration登録方式を確認してください。

## 4. Authentication

`src/auth.ts`:

- Credentials Provider
- email / password
- bcrypt password verification
- login rate limit: 10回 / 15分
- adminとmemberを同一ログイン入口から認証
- approved memberのみmemberログイン可能

`src/auth.config.ts`:

- JWT session
- role / adminRoleをJWTとsessionへ格納
- session maxAge: 14日
- trustHost=true（Cloudflare/Vercel等のproxy環境対応）

## 5. Route protection

`src/proxy.ts`は公開ルート以外についてsession cookieの有無を確認します。APIは未ログイン時にHTML redirectではなく401 JSONを返します。

加えてAPI mutationにはcross-site protectionがあり、`Sec-Fetch-Site`や`Origin`を利用してcross-site mutationを拒否します。

例外:

- Auth.js routes
- LINE webhook（LINE署名で別認証）

実際のrole authorizationは各APIで`auth()`と`requireEditor` / `requireSuperAdmin`等を使って実施します。proxyのcookie存在確認だけを認可とみなしてはいけません。

## 6. Admin roles

- `superadmin`: 高権限。管理者設定、機能フラグ、監査ログ等。
- `editor`: 通常の更新業務。
- `viewer`: 読取中心。`requireEditor()`で書込APIを拒否。

詳細は`ROLES_AND_PERMISSIONS.md`。

## 7. Transaction-critical areas

Production PostgreSQLで特にtransaction整合性が重要な処理:

- 注文作成 + order items + 在庫引当 + 在庫移動 + status history + audit
- キャンセル承認 + 在庫返却
- 請求書作成 + invoice order snapshot
- 注文ステータス変更

注文作成は同一memberの短時間重複送信を抑止するためPostgreSQL advisory lockと直近注文照合も利用します。

## 8. Notifications

注文transaction完了後にメールとLINE通知を実行します。通知失敗によって成立済み注文をrollbackしない設計です。

LINE側はretry key、timeout、5xx retry、失敗分類を持ちます。

## 9. Security-related code

- `src/proxy.ts`: cross-site mutation protection / HSTS
- `src/auth.ts`: credentials / rate limit
- `src/lib/admin-auth.ts`: admin role authorization
- `src/lib/line/verify-signature.ts`: LINE HMAC SHA-256署名検証
- `scripts/secret-scan.ts`: repository secret scan
- upload API: MIME whitelist / 3MB limit / editor権限

## 10. Generated inventories

コードとドキュメントの乖離確認に利用します。

- `generated/ROUTES.md`
- `generated/API_INVENTORY.md`
- `generated/DATABASE_SCHEMA.md`
- `generated/MIGRATIONS.md`
