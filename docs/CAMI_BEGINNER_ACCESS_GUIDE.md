# Cami受発注システム アクセスガイド（初心者向け）

> ログイン情報（パスワード）はこのファイルに記載しません。
> 秘密ファイルを参照してください: `/Users/hiroshikento/Documents/Cami受発注システム_ログイン情報_秘密.txt`

---

## 1. URLまとめ

| 用途 | URL | 備考 |
|------|-----|------|
| ローカル店舗画面 | http://localhost:3000 | `npm run dev` 起動後 |
| ローカル管理画面 | http://localhost:3000/admin/dashboard | 同上（同一ポート） |
| ローカルログイン | http://localhost:3000/login | 管理者・店舗共通 |
| ローカル会員登録 | http://localhost:3000/register | 店舗が自己申請 |
| Mailpit（メール確認） | http://localhost:8025 | Docker起動後に使用可 |
| Health確認 | http://localhost:3000/api/health | 常時OK返答 |
| Readiness確認 | http://localhost:3000/api/readiness | DB接続確認 |
| 本番URL | 未確認（README: NOT READY） | Vercel管理画面で確認 |
| GitHub | https://github.com/camiordersystem-maker/cami.git | — |

---

## 2. ロール説明

### 管理者ロール（本部）

| ロール | ログイン | できること | できないこと |
|--------|----------|-----------|------------|
| **superadmin** | 可 | 全機能 + 管理者アカウント管理 | なし |
| **editor** | 可 | 注文・在庫・商品・会員・請求・約款・お知らせ操作 | 管理者アカウントの追加・削除 |
| **viewer** | 可 | 全画面の閲覧 | データの変更（書き込み全般） |

### 会員ロール（加盟店）

| ステータス | ログイン | 発注 | 備考 |
|-----------|----------|------|------|
| **approved** | 可 | 可 | 通常の加盟店 |
| **pending** | 不可 | 不可 | 申請後、本部承認待ち |
| **rejected** | 不可 | 不可 | 申請却下 |
| **suspended** | 不可 | 不可 | 停止処分中 |

---

## 3. システム起動手順

### ローカル起動（最小構成：SQLite）

```bash
# ターミナルを開く
cd /Users/hiroshikento/cami-order-system

# 依存パッケージインストール（初回のみ）
npm install

# DBマイグレーション（初回 or スキーマ変更時）
npm run db:migrate

# シードデータ投入（初回のみ）
npm run seed

# 起動
npm run dev
```

ブラウザで http://localhost:3000 を開く。

### ローカル起動（Docker PostgreSQL + Mailpit）

```bash
cd /Users/hiroshikento/cami-order-system

# Docker一括セットアップ（初回）
npm run local:setup

# 起動（Dockerは常駐させたまま Next.jsだけ起動）
npm run local:start
```

停止:
```bash
npm run local:stop
```

### 現在の起動状態確認

```bash
# Next.jsが起動中か確認
curl -s http://localhost:3000/api/health | python3 -m json.tool

# DBが接続できているか確認
curl -s http://localhost:3000/api/readiness | python3 -m json.tool

# Dockerが起動しているか確認
docker ps --filter "name=cami"
```

---

## 4. 管理画面の見方

ログインURL: http://localhost:3000/login
→ ログイン後 http://localhost:3000/admin/dashboard へ自動遷移

### /admin/dashboard（ダッシュボード）

**何を見る:** 本日の注文数・先月売上・在庫警告

- 赤いカード → 在庫が残り10箱以下の商品あり。すぐに在庫補充を検討
- 緑のカード → 在庫問題なし
- 最新注文リスト → 今日来た注文の一覧

### /admin/orders（注文一覧）

**何を見る:** 全加盟店からの注文

- タブで絞り込み: 全件 / 保留中 / 確定 / 発送済 / 配達完了 / キャンセル / キャンセル申込中
- フィルタ: ステータス・期間・会社名で絞り込み可
- 並び替え: 日付・金額順

クリックして注文詳細 `/admin/orders/[id]` へ。

### /admin/orders/[id]（注文詳細）

**操作:**

1. 「確定」ボタン → 注文を受け付ける（pending → confirmed）
2. 「発送済み」ボタン → 追跡番号を入力してから実行（confirmed → shipped）
3. 「配達完了」ボタン → shipped → delivered
4. 「キャンセル申込中」パネル → 店舗からのキャンセル申請を承認 or 却下

**注意:** 発送時は追跡番号必須。キャンセル実行時は理由必須。

### /admin/members（会員一覧）

**何を見る:** 全加盟店の状態

- pending → 承認ボタンを押す → approved になりログイン可能
- 詳細画面でランク変更可

### /admin/members/new（会員新規登録）

本部が直接加盟店アカウントを作る場合に使用。

### /admin/products（商品管理）

**何を見る:** 販売商品一覧

- 商品の有効/無効切り替え
- 定価・箱あたり本数の編集

### /admin/inventory（在庫管理）

**何を見る:** 現在在庫・入庫履歴

- 「在庫調整」ボタン → 数量と理由を入力して手動調整
- 調整理由は必須（inventory_movementsテーブルに記録される）
- 10箱以下で警告表示

### /admin/ranks（ランク管理）

**何を見る:** 卸値掛け率設定

- スタンダード（50%）・シルバー（45%）・ゴールド（40%）・プラチナ（35%）
- 月間最低箱数の設定が可能

### /admin/terms（約款管理）

**何を見る:** 利用規約のバージョン管理

- 「下書き作成」→「公開」の2ステップ
- 公開済み約款を直接編集は不可（新バージョンとして作成される）
- 公開すると加盟店は次回注文時に同意が必要になる

### /admin/administrators（管理者管理）

**superadminのみアクセス可**

- 管理者の追加・削除・ロール変更（superadmin/editor/viewer）

### /admin/invoices（請求一覧）

**現状: 月次集計のみ実装。PDF・メール・入金処理は未実装。**

- 月次請求集計の確認のみ可能
- 支払い状況の更新（paid/unpaid/overdue）は可能
- PDF・メール送信・請求書再発行は未実装 → システム外で対応

### /admin/announcements（お知らせ管理）

- 全店舗向け or 特定店舗向けのお知らせ作成・削除
- 有効期限の設定可

### /admin/settings（システム設定）

- 振込先情報等の設定

---

## 5. 店舗画面の見方

ログインURL: http://localhost:3000/login
→ ログイン後 http://localhost:3000/dashboard へ自動遷移

### /dashboard（ダッシュボード）

- 最新3件のお知らせ
- 最近の注文サマリ

### /products（商品・注文）

**注文の流れ:**

1. 商品の箱数を入力
2. 「注文確認」ボタン → 金額確認画面へ
3. 配送先を選択
4. 約款に同意（未同意の場合は先に同意が必要）
5. 「注文を確定する」ボタン → 注文完了

**金額表示:**
- 商品合計（税抜）
- 消費税（10%）
- 送料は別途（別途案内）

### /orders（注文履歴）

- 自分の店舗の注文一覧
- クリックで詳細へ

### /orders/[id]（注文詳細）

- ステータス確認
- pending / confirmed の場合 → 「キャンセルを申し込む」ボタンあり
- cancel_requested → 「キャンセル申込済み（審査中）」表示
- shipped → 追跡番号表示

### /addresses（配送先管理）

- 配送先住所の追加・編集・削除
- デフォルト設定

### /terms（利用規約）

- 現在公開中の利用規約を確認
- 同意ボタンで同意記録（注文前に必要）

### /account（アカウント）

- 店舗情報の確認・一部編集

### /announcements（お知らせ）

- 本部からのお知らせ一覧
- 未読バッジあり

---

## 6. 注文フロー詳細

```
店舗 → /products で注文
         ↓
    約款同意チェック（未同意なら/termsへ誘導）
         ↓
    在庫確認（不足なら注文不可）
         ↓
    注文確定（status: pending）
         ↓
管理者 → /admin/orders で確認
         ↓
    「確定」ボタン（status: confirmed）
         ↓
    「発送済み」ボタン + 追跡番号（status: shipped）
         ↓
    「配達完了」ボタン（status: delivered）
```

### キャンセルフロー

```
店舗 → /orders/[id] で「キャンセルを申し込む」
         ↓
    status: cancel_requested（在庫はまだ戻らない）
         ↓
管理者 → /admin/orders/[id] キャンセル申込中パネル
         ↓
    「承認」→ status: cancelled、在庫が戻る、履歴記録
    「却下」→ 元のステータスに戻る
```

- 在庫が戻るのは管理者が「承認」した時点のみ
- キャンセル履歴は inventory_movements と order_status_histories に記録される
- 同一注文への二重キャンセル申請はシステムが弾く（cancel_requested中は申請ボタン非表示）

---

## 7. 在庫確認

| 確認したいこと | 操作 |
|--------------|------|
| 現在庫 | /admin/inventory を開く |
| 低在庫警告 | /admin/dashboard の赤いカード |
| 在庫調整 | /admin/inventory → 「在庫調整」ボタン（理由必須） |
| 在庫履歴 | inventory_movements テーブル（SQLエディタで確認） |
| 調整理由 | 調整時に必須入力 |

在庫移動ログの種別:
- `initial` … 初期在庫
- `inbound` … 入庫
- `order_allocation` … 注文で減った
- `cancellation_return` … キャンセル承認で戻った
- `manual_adjustment` … 手動調整

---

## 8. 請求確認（現状の制限）

| 機能 | 実装状況 |
|------|---------|
| 月次請求集計 | 実装済み |
| 請求詳細確認 | 実装済み |
| 支払い状況変更（paid/unpaid/overdue） | 実装済み |
| PDF出力 | 未実装 |
| メール送付 | 未実装 |
| 請求書再発行 | 未実装 |
| 入金確認ワークフロー | 未実装 |

→ 請求・入金はシステム外（別途）で運用すること

---

## 9. ログの見方

### ターミナルログ（Next.js）

`npm run dev` を実行したターミナルにサーバーログが流れる。
エラー時は赤字で表示される。

### ブラウザのコンソールエラー

Chrome/Safari → 右クリック→「検証」→「コンソール」タブ
赤いエラーが出ていれば、メッセージをコピーして確認する。

### HTTPステータスコードの意味

| コード | 意味 | 対処 |
|--------|------|------|
| 200 | 正常 | — |
| 201 | 作成成功 | — |
| 400 | 入力値エラー | エラーメッセージを確認して再入力 |
| 401 | 未ログイン | ログインし直す |
| 403 | 権限不足 | superadmin/editorにロール変更が必要 |
| 404 | 対象なし | IDやURLを確認 |
| 409 | 競合（すでに存在など） | 状態を確認して再操作 |
| 422 | バリデーションエラー | 必須項目や形式を確認 |
| 429 | レート制限（ログイン失敗多数） | 15分後に再試行 |
| 500 | サーバーエラー | ターミナルログを確認 |

### Health / Readiness確認

```bash
# プロセス生存確認
curl http://localhost:3000/api/health

# DB接続確認
curl http://localhost:3000/api/readiness
```

正常なら `{ "ok": true, "data": { "status": "ready", ... } }` が返る。

---

## 10. Mailpit（メール確認）

URLhttp://localhost:8025

Dockerが起動していれば、システムが送信したメールをここで確認できる。
（実際のメール送信はされない。テスト用メールキャプチャ）

DockerコンテナがUpの確認:
```bash
docker ps --filter "name=cami-local-mailpit"
```

起動していない場合:
```bash
docker compose -f /Users/hiroshikento/cami-order-system/docker-compose.yml up -d mailpit
```

---

## 11. Vercelの見方

**プロジェクト名:** 未確認（Vercel管理画面で確認してください）

確認する順番:
1. https://vercel.com にログイン
2. プロジェクト一覧から `cami` に関連するプロジェクトを選ぶ
3. 「Deployments」タブ → 最新デプロイが `Ready` か `Error` か確認
4. `Error` の場合 → 該当デプロイをクリック → 「Build Logs」でエラー内容を確認
5. 「Settings」→「Environment Variables」→ `DATABASE_URL`, `AUTH_SECRET` が設定されているか確認
6. 「Settings」→「Domains」→ 本番URLを確認

---

## 12. Neonの見方

**プロジェクト名:** 未確認（Neon管理画面で確認してください）

確認する順番:
1. https://neon.tech にログイン
2. プロジェクト一覧から `cami` に関連するプロジェクトを選ぶ
3. 「Tables」→ テーブル一覧でDBスキーマを確認
4. 「SQL Editor」→ `SELECT COUNT(*) FROM orders;` 等でデータ確認
5. 「Branches」→ `main`（本番）と `staging`（検証）が分かれているか確認
6. 「Connection Details」→ DATABASE_URLのホスト名を確認（完全なURLはVercel環境変数で管理）

---

## 13. GitHubの見方

- リポジトリ: https://github.com/camiordersystem-maker/cami
- ブランチ: `main`（本番相当）
- コミット確認: `git log --oneline -10`
- pushされているか: `git status` → `nothing to commit` + `git log origin/main -1`

---

## 14. よくある問題と対処

| 症状 | 原因 | 対処 |
|------|------|------|
| localhost:3000 が開かない | Next.jsが起動していない | `npm run dev` を実行 |
| ログインできない（管理者） | パスワード間違い or アカウント未作成 | 秘密ファイルを確認。seedが未実行なら `npm run seed` |
| ログインできない（店舗） | status が pending/rejected/suspended | /admin/members で approved に変更 |
| 15分ログインできない | ログイン失敗10回超（レート制限） | 15分待つ |
| 注文できない（約款） | 最新利用規約に未同意 | /terms で同意ボタンを押す |
| 注文できない（在庫不足） | 在庫が0箱 | /admin/inventory で在庫調整 |
| DB接続エラー | SQLite: ファイル欠損 / PG: Docker停止 | `npm run db:migrate` またはDocker起動 |
| 500エラー | サーバーエラー | ターミナルのエラーログを確認 |
| migration未適用 | 新しいSQLファイルが未実行 | `npm run db:migrate` |
| ポート3000使用中 | 別プロセスが使用中 | `lsof -i :3000` で確認して終了 |
| Dockerが起動していない | Mailpit・PostgreSQL未起動 | `docker compose up -d` |
| メールが来ない | Dockerのmailpit未起動 | http://localhost:8025 を確認 |
| 本番とローカルを間違えた | .env.local の DATABASE_URL 確認 | `grep DATABASE_URL .env.local` の先頭を確認（localhost ならローカル） |

---

## 15. 確認する順番（トラブル時）

1. `curl http://localhost:3000/api/health` → 起動しているか
2. `curl http://localhost:3000/api/readiness` → DBが繋がっているか
3. ターミナルのNext.jsログにエラーがないか
4. ブラウザのコンソールにエラーがないか
5. `/admin/dashboard` が開けるか
6. 上記で問題なければ個別の操作を確認

---

_最終更新: 2026-07-03_
