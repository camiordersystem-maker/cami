# Screen Specification

画面の実ルート一覧は`generated/ROUTES.md`をsource-linked inventoryとして利用します。本書は人が用途・主要操作を把握するための画面仕様です。

## Public

| Route | Screen | Main actions |
|---|---|---|
| `/login` | ログイン | email/password認証 |
| `/register` | 新規会員登録申請 | 会社/サロン、担当者、連絡先、事業概要、passwordを申請 |
| `/` | role router | session roleに応じてmember/adminへ振り分け |

## Member

| Route | Screen | Purpose / main actions |
|---|---|---|
| `/dashboard` | 店舗ダッシュボード | rank、注文数、確認待ち、最近の注文、お知らせ |
| `/products` | 商品注文 | 商品/箱数/配送先選択、確認、注文確定、CSV/再注文 optional |
| `/orders` | 注文履歴 | 過去注文一覧、status、詳細/請求/再注文への導線 |
| `/orders/[id]` | 注文詳細 | 注文明細、配送先、status timeline、キャンセル申込 |
| `/orders/[id]/invoice` | 注文請求書 | 注文ベースの請求表示・印刷 |
| `/invoices/[id]` | 月次請求書 | 月次請求書表示・印刷 |
| `/addresses` | 配送先管理 | 追加、default変更、削除 |
| `/announcements` | お知らせ | 一覧、本文、既読化 |
| `/terms` | 契約書・約款 | 最新公開約款表示、同意導線 |
| `/account` | アカウント設定 | login情報、password変更 |
| `/help` | ヘルプ一覧 | 店舗マニュアル一覧 |
| `/help/[slug]` | ヘルプ記事 | 画面キャプチャ、初心者向け手順 |

## Admin — normal operations

| Route | Screen | Purpose / main actions |
|---|---|---|
| `/admin/dashboard` | 本部ダッシュボード | 注文、会員、請求、在庫警告、売上/最近の注文 |
| `/admin/orders` | 注文管理 | 一覧、filter/search、detailへ移動 |
| `/admin/orders/[id]` | 注文詳細 | status更新、追跡番号、キャンセル審査、監査確認 |
| `/admin/orders/[id]/delivery-note` | 納品書 | 印刷用納品書 |
| `/admin/invoices` | 請求書管理 | 月次請求書発行、一覧 |
| `/admin/invoices/[id]` | 請求書詳細 | 内訳、支払status、印刷、optional email |
| `/admin/members` | 会員管理 | 一覧、status、detail、新規登録への導線 |
| `/admin/members/new` | 本部会員登録 | 本部側から会員作成 |
| `/admin/members/[id]` | 会員詳細 | 会員情報、status/rank、配送先、関連情報 |
| `/admin/products` | 商品管理 | 商品作成/編集、active、画像 |
| `/admin/inventory` | 在庫管理 | 在庫数、調整、入庫履歴、警告 |
| `/admin/ranks` | ランク管理 | rank/rate管理 |
| `/admin/terms` | 約款管理 | draft、publish |
| `/admin/announcements` | お知らせ管理 | all/individual作成、期限、削除 |
| `/admin/help` | 管理者ヘルプ | 本部マニュアル一覧 |
| `/admin/help/[slug]` | 管理者ヘルプ記事 | 画面キャプチャ、手順、注意事項 |

## Admin — superadmin

| Route | Screen | Purpose / main actions |
|---|---|---|
| `/admin/administrators` | 管理者設定 | admin account、role、active |
| `/admin/settings` | システム設定 | 会社情報、invoice登録番号、低在庫閾値等 |
| `/admin/feature-flags` | 機能フラグ | optional機能ON/OFF |
| `/admin/audit-logs` | 監査ログ | actor/action/target/date filtering、変更追跡 |

## Common UI rules

- Desktop: left sidebar。
- Mobile: hamburger drawer。
- Member sidebar: blue系。
- Admin sidebar: slate系。
- STAGING環境はtop bannerを表示。
- 各主要業務画面に「？ この画面の使い方」を表示。
- Help pageではcontext help linkを重複表示しない。
- logoutはsidebar/footerから実行。

## Accessibility / responsive baseline

RC2では主要管理画面についてH1、control label、duplicate ID、page-level overflow、mobile logout等をrelease前に監査したbaselineがあります。今後画面改修時も同等チェックを維持してください。
