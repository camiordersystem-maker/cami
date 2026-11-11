# Data Model

PostgreSQL schema source of truth: `src/lib/db/schema-pg.ts`

全カラムの自動生成一覧: `generated/DATABASE_SCHEMA.md`

## 1. 主要エンティティ

| テーブル | 役割 |
|---|---|
| `member_ranks` | 会員ランクと掛け率 |
| `members` | 店舗・加盟店アカウント |
| `admins` | 本部管理者 |
| `shipping_addresses` | 店舗配送先。soft delete |
| `products` | 商品マスタ |
| `inventory` | 商品ごとの利用可能箱数 |
| `inventory_receipts` | 入庫・在庫更新履歴の一部 |
| `orders` | 注文ヘッダ |
| `order_items` | 注文明細 |
| `inventory_movements` | 在庫移動台帳 |
| `order_status_histories` | 注文状態遷移履歴 |
| `monthly_invoices` | 現行UIで扱う月次請求書 |
| `invoice_orders` | 請求書発行時の対象注文snapshot |
| `audit_logs` | 操作監査 |
| `terms` | 約款version / 公開状態 |
| `member_terms_consents` | 会員の約款同意 |
| `system_settings` | 会社・請求・在庫等のsingleton設定 |
| `notifications` | 会員向けシステム通知 |
| `announcements` | お知らせ |
| `announcement_reads` | お知らせ既読 |
| `feature_flags` | 追加機能ON/OFF |

`invoices / invoice_items / payments`もschemaに存在します。現行の月次請求UI/APIでは主に`monthly_invoices`系を利用しているため、同名概念を混同しないでください。

## 2. Enum

PostgreSQLで定義される主要enum:

### member_status

- pending
- approved
- rejected
- suspended

### order_status

- pending
- confirmed
- shipped
- delivered
- cancelled
- cancel_requested

### actor_role

- admin
- member

正確な現行値は`generated/DATABASE_SCHEMA.md`を再生成して確認してください。

## 3. 重要な一意性

コード上の代表例:

- member email unique
- admin email unique
- productごとのinventory unique
- order number unique
- monthly invoice number unique
- invoice order pair unique

詳細index / constraintはgenerated schemaとmigration SQLを確認してください。

## 4. 注文と在庫

注文作成と在庫引当は同一transactionで扱うProduction経路があります。

在庫更新では単に`inventory.available_boxes`を更新するだけでなく、`inventory_movements`へbefore/afterと理由を残す設計を維持してください。

## 5. 請求書snapshot

`invoice_orders`は重要です。発行済み請求書の合計値と表示内訳が、後日の注文status変更でズレるのを防ぎます。

このテーブルを外して期間+statusの再集計だけに戻さないでください。

## 6. Migration

Production PostgreSQL migration:

`src/lib/db/migrations/pg/*.sql`

現行一覧:

`generated/MIGRATIONS.md`

このリポジトリではmigration runner固有の登録処理もあるため、新規migration追加時はSQLファイルを置くだけで完了と判断せず`src/lib/db/migrate.pg.ts`を確認してください。

SQLite側も同時に維持します。
