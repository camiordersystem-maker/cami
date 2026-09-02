# Roles and Permissions

## 1. 認証ロール

Auth.js session上の大分類:

| role | 対象 |
|---|---|
| `member` | 店舗・加盟店 |
| `admin` | Cami本部 |

adminには別途`adminRole`があります。

| adminRole | 想定権限 |
|---|---|
| `superadmin` | すべての管理機能、高権限設定 |
| `editor` | 通常の業務更新 |
| `viewer` | 読取中心 |

## 2. Server-side enforcement

`src/lib/admin-auth.ts`:

- `requireAdmin`: adminでなければ拒否
- `requireEditor`: adminかつviewer以外
- `requireSuperAdmin`: adminかつsuperadmin

**画面でボタンが隠れていることはセキュリティ境界ではありません。API側のauthorizationがsource of truthです。**

## 3. 店舗権限

店舗は自分のscopeに限定して次を利用します。

- 自分の商品注文
- 自分の注文一覧 / 詳細
- 自分のキャンセル申込
- 自分の配送先
- 自分の請求書
- 自分向けのお知らせ
- 自分の約款同意
- 自分のパスワード変更

配送先API等はmemberId所有権を検証します。

## 4. 管理者通常業務

adminで利用可能な読取画面:

- ダッシュボード
- 注文
- 請求書
- 会員
- 商品
- 在庫
- ランク
- 約款
- お知らせ
- ヘルプ

更新操作は多くのAPIで`requireEditor`が必要なためviewerは拒否されます。

## 5. superadmin専用

コード上`requireSuperAdmin`が使われる主なAPI:

- 管理者アカウント管理
- 機能フラグ
- 監査ログ

管理画面ナビゲーションでもsuperadminだけに高権限メニューを表示します。

## 6. 権限変更時の注意

- 最小権限を原則とする。
- 共有管理者アカウントを作らず、個人単位で発行する。
- viewerへ書込権限を期待しない。
- superadmin付与は限定する。
- 管理者アカウント変更は監査対象として扱う。

## 7. API別の確認

自動生成一覧:

`generated/API_INVENTORY.md`

同一route内でGETとwriteの権限が異なる場合があるため、最終判断は各`route.ts`を確認してください。
