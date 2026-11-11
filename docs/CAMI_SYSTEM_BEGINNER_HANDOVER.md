# Cami受発注システム 完全引き継ぎ書（初心者向け）

> **Legacy handover note:** この文書は2026-07-03時点のローカル引き継ぎ履歴です。branch、version、Production readiness等は現状と異なります。現在情報は`docs/README.md`配下を優先してください。

作成日: 2026-07-03
対象プロジェクト: /Users/hiroshikento/cami-order-system
作業ブランチ: codex/local-complete-and-handover
判定: CONDITIONAL LOCAL READY

この文書は、Cami受発注システムをローカルPC上で安全に起動・確認・バックアップ・復元できる状態へ引き継ぐための説明書です。専門用語をできるだけ少なくし、初めて触る人でも順番に実行できるようにしています。

## 01. まず結論
ローカル環境はDockerのPostgreSQLとMailpitで再現できます。`npm run local:setup`でDB起動、マイグレーション、初期データ投入、検証まで通ります。lint、型チェック、既存テスト、DB検証、preflight、ビルド、秘密情報スキャン、ローカル疎通確認も通過済みです。

## 02. 今回の状態
ローカル開発・検証に必要な仕組みは整いました。ただし、本番公開の最終判断には、実サービス用の環境変数、メール送信設定、Vercel/Neonなど外部サービス設定、管理者による画面操作確認が必要です。

## 03. 判定の意味
`CONDITIONAL LOCAL READY`は「ローカルでは引き継ぎ可能。ただし本番公開前に人間の確認と外部サービス設定が必要」という意味です。

## 04. 絶対にやってはいけないこと
Production DBへ接続しないでください。GitHubへpushしないでください。mainへmergeしないでください。Vercel Productionへdeployしないでください。`git reset --hard`やforce pushも使わないでください。

## 05. 最初に開く場所
プロジェクトフォルダは `/Users/hiroshikento/cami-order-system` です。ターミナルでこのフォルダを開いて作業します。

## 06. ブランチ
作業ブランチは `codex/local-complete-and-handover` です。公開前の作業をこのブランチ上で確認します。

## 07. 必要なソフト
Node.js、npm、Docker Desktopが必要です。今回の検証ではNode.js v25.9.0、npm 11.12.1、Docker 29.6.1、Docker Compose 5.2.0、Next.js 16.2.10で動作確認しました。

## 08. ローカル環境の全体像
アプリ本体はNext.jsです。データベースはDocker上のPostgreSQL、メール確認はMailpitを使います。ローカルでは本物のメール送信をせず、Mailpitの画面でメールを確認できます。

## 09. 追加された主なファイル
`docker-compose.yml`、`.env.local.example`、`scripts/local-*.ts`、`scripts/secret-scan.ts`が追加されました。これらがローカル再現の中心です。

## 10. Dockerで起動するもの
PostgreSQLコンテナ `cami-local-postgres` とMailpitコンテナ `cami-local-mailpit` が起動します。

## 11. ローカルPostgreSQL
接続先は `localhost:54329`、DB名は `cami_local`、ユーザーは `cami` です。ローカル専用の値なので本番とは分離されています。

## 12. Mailpit
MailpitのWeb画面は `http://localhost:8025` です。SMTPは `localhost:1025` です。

## 13. 最初のセットアップ
次を実行します。

```bash
npm run local:setup
```

これでDocker起動、DBマイグレーション、初期データ投入、DB検証まで行います。

## 14. .env.local
`.env.local`がない場合、`.env.local.example`から自動コピーされます。ローカル用の安全なダミー値が入っています。

## 15. 管理者ログイン
ローカル初期データの管理者は `admin@cami.local / Admin1234!` です。これはローカル確認用です。本番で使わないでください。

## 16. 会員ログイン
ローカル初期データの会員は `test-salon@example.com / Member1234!` です。これもローカル確認用です。

## 17. アプリ起動
通常は次で起動します。

```bash
npm run dev
```

3000番が使われている場合は、別ポートで `npx next dev -p 3010` のように起動できます。

## 18. アクセス先
会員画面は `http://localhost:3000`、管理画面はログイン後に `/admin/dashboard` へ進みます。

## 19. ローカル停止
Dockerコンテナを止めるには次を実行します。

```bash
npm run local:stop
```

## 20. DBリセット
ローカルDBだけを空にするには次を実行します。

```bash
CONFIRM_LOCAL_RESET=true npm run local:reset
```

誤操作防止のため、確認用の環境変数が必要です。

## 21. 初期データ投入
リセット後に初期データを戻すには次を実行します。

```bash
npm run local:seed
```

## 22. DB検証
テーブル存在と件数を見るには次を実行します。

```bash
npm run local:verify
```

## 23. バックアップ
ローカルDBのバックアップは次で作成します。

```bash
npm run local:backup
```

保存先の既定値は `/Users/hiroshikento/Documents/SHIMA CRAFT Backups/cami-order-system` です。

## 24. 復元
バックアップからローカルDBへ復元するには次を使います。

```bash
RESTORE_FILE="/path/to/backup.sql" CONFIRM_LOCAL_RESTORE=true npm run local:restore
```

復元前にローカルDBのpublicスキーマを作り直します。対象はローカルDBだけです。

## 25. ローカル疎通確認
アプリを起動してから次を実行します。

```bash
LOCAL_APP_URL=http://localhost:3000 npm run local:smoke
```

`/api/health`、`/login`、`/register`が応答するか確認します。

## 26. 品質チェックまとめ
今回通過した確認は、`npm run lint`、`npm run typecheck`、`npm test`、`npm run db:verify`、`npm run local:test`、`npm run preflight`、`npm run scan:secrets`、`npm run local:smoke`です。

## 27. lint結果
lintは警告ゼロです。未使用importやReact Hook依存関係の警告を実修正で解消しました。

## 28. 型チェック結果
`npm run typecheck`は通過しました。

## 29. テスト結果
`npm test`は通過しました。現在の自動テストは業務ルールの単体テスト中心です。

## 30. DB検証結果
`npm run db:verify`は通過しました。スキーマ上の必須構造を確認しています。

## 31. preflight結果
`npm run preflight`はNext.js 16.2.10のwebpackビルド込みで通過しました。production buildも成功しています。

## 32. 秘密情報スキャン
`npm run scan:secrets`は通過しました。ローカル用のダミー値は許可し、本物らしいAPIキーやトークンを検出する形に調整済みです。

## 32-A. npm auditの注意
`npm audit --audit-level=moderate`は0件です。Next.jsを16.2.10へ更新し、PostCSSとdrizzle-kit経由のesbuildはnpm overridesで安全版へ固定しました。更新に伴い、Next 16形式のparams/searchParams、proxy、webpackビルド明示、outputFileTracingRootも対応済みです。

## 33. ローカルDB接続の変更
`src/lib/db/index.ts`は、PostgreSQL URLがlocalhost/127.0.0.1/::1の場合は通常の`pg`接続を使います。本番や共有環境のNeon接続は従来通りNeon serverless接続を使います。

## 34. なぜ接続を分けたか
Neon serverlessの接続方式はローカルPostgreSQLにそのまま使えません。そのため、ローカルでは一般的なPostgreSQL接続に切り替えています。

## 35. マイグレーション
ローカル用マイグレーションは `npm run local:migrate` です。適用済みファイルは `_local_migrations` テーブルで管理します。

## 36. seed
ローカルseedはNeon専用ではなく、通常のPostgreSQL接続で動きます。ランク、管理者、商品、在庫、テスト会員、配送先、設定、利用規約を作ります。

## 37. 注文機能の状態
注文、在庫引当、注文ステータス、キャンセル申込・承認・拒否に関するコードとテーブルは存在しています。画面での最終手動確認は必要です。

## 38. 在庫機能の状態
商品別在庫、在庫移動履歴、入庫、在庫警告の仕組みがあります。実運用前に実在庫数と閾値を入力してください。

## 39. キャンセル機能の状態
会員がキャンセル申込を行い、管理者が承認または拒否する流れがあります。承認時の在庫戻しは重要なので、画面で必ず確認してください。

## 40. 認証の状態
NextAuthベースのログインがあります。管理者・会員の権限分岐があります。本番では強い`AUTH_SECRET`または`NEXTAUTH_SECRET`を設定してください。

## 41. 管理者権限
管理者にはroleがあります。編集系操作はeditor以上、管理者追加などはsuperadminが必要です。ローカルseedの管理者はsuperadminです。

## 42. 利用規約
利用規約の公開、会員同意、同意必須チェックの仕組みがあります。本番公開前に正式な規約文へ差し替えてください。

## 43. 請求書
月次請求書、請求明細、支払い状態、印刷/PDF保存の画面があります。インボイス登録番号や会社情報は管理画面で本番値を設定してください。

## 44. 支払い
支払い状態は未払い、支払い済み、期限超過などを扱います。実入金との照合は現時点では手動運用前提です。

## 45. メール
ローカルではMailpitで確認します。本番ではResendなどの実APIキー、送信元ドメイン、DNS認証が必要です。

## 46. ファイルアップロード
アップロードAPIがあります。本番ではVercel Blobなどの保存先設定と権限確認が必要です。

## 47. CSVエクスポート
管理画面に会員、注文、在庫のエクスポートAPIがあります。文字化けや列順は手動チェックリストで確認してください。

## 48. ヘルスチェック
`/api/health`があります。ローカル疎通確認でも使っています。

## 49. readiness
`/api/readiness`があります。本番監視に使う場合は、監視元と認証要否を運用設計してください。

## 50. バックアップ方針
ローカルは`npm run local:backup`でSQLファイルを残します。本番DBのバックアップはNeon/Vercel側の機能で別途設計してください。

## 51. 復元方針
ローカル復元は確認フラグ必須です。本番復元は絶対にこのローカルコマンドで行わず、本番用の手順書と承認を使ってください。

## 52. よくあるエラー: ポート使用中
`EADDRINUSE`が出たら、そのポートは既に使われています。別ポートで起動してください。例: `npx next dev -p 3010`。

## 53. よくあるエラー: Docker未起動
PostgreSQLに接続できない場合はDocker Desktopを起動し、`npm run local:start`または`npm run local:setup`を実行してください。

## 54. よくあるエラー: DBが空
画面にデータがない場合は`npm run local:seed`を実行してください。

## 55. よくあるエラー: ログインできない
`.env.local`があるか、DBにseedが入っているかを確認してください。ローカル管理者は `admin@cami.local / Admin1234!` です。

## 56. 作業前の安全確認
作業前には `git status --short --branch` でブランチと未コミット変更を確認してください。

## 57. 作業後の確認
作業後には少なくとも `npm run lint`、`npm run typecheck`、`npm test` を実行してください。DB変更がある場合は `npm run db:verify` と `npm run local:setup` も実行してください。

## 58. コミット方針
今回の作業はローカルコミットまでに留めます。GitHubへのpushやmainへのmergeは行いません。

## 59. 本番公開前に必要な外部設定
本番DB、メール送信、Blob保存、独自ドメイン、HTTPS、環境変数、DNS、監視、バックアップ、運用担当者を確認してください。

## 60. 本番環境変数
本番ではダミー値を使わないでください。`DATABASE_URL`、`AUTH_SECRET`、メールAPIキー、Blobトークンなどを正式値にします。

## 61. 本番DBへの注意
Production DBのURLをローカルコマンドへ入れないでください。ローカル用スクリプトはlocalhostかつDB名`cami_local`以外を拒否します。

## 62. 手動確認が必要な理由
自動チェックは「壊れていない可能性」を高めますが、業務上の正しさ、表示文言、請求書の見た目、メール文面、権限運用は人間の確認が必要です。

## 63. 最低限の手動確認
会員登録、管理者承認、ログイン、利用規約同意、商品注文、在庫減少、キャンセル申込、キャンセル承認、請求書発行、支払い状態更新を確認してください。

## 64. 運用開始時の初期設定
管理画面で会社名、住所、電話番号、メール、インボイス登録番号、低在庫閾値、商品画像、商品情報、会員ランクを設定してください。

## 65. 監視
公開後はログ、エラー、DB接続、メール送信失敗、在庫不足、注文失敗を監視してください。

## 66. 障害時
まず影響範囲を止めて、注文・在庫・請求に不整合がないか確認します。必要なら`docs/INCIDENT_RESPONSE.md`も参照してください。

## 67. 今回確認済みのローカルDB件数
seed後は、管理者1、会員1、ランク4、商品2、在庫2、配送先1、公開規約1が入ります。注文・請求・支払いは画面確認で作成してください。

## 68. 引き継ぎのゴール
次の担当者は、この文書と手動チェックリストを見ながらローカルで安全に起動し、業務フローを確認し、本番公開前に必要な外部設定と人間確認を進められます。
