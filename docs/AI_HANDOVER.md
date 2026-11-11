# 別AIへの引き継ぎ書

作成日: 2026-08-31
作成: Claude Code（このセッションまでの作業を引き継ぐ）
対象: このプロジェクトを今後担当する別のAIエージェント（Codex, Manus AI, 別のClaude Codeセッション等）

この文書は、初めてこのプロジェクトに触るAIが「何がどこにあり、何がまだ終わっていないか」を素早く把握するためのものです。コード自体から読み取れることは書きません（それはコードを読めば分かるため）。**コードや過去のやり取りを読んでも分からない、経緯・判断理由・未解決の問題**を中心に書いています。

## 1. このシステムは何か

Cami受発注システム（オイル商材のBtoB受発注システム）。本部（運営側）と店舗（取引先）が使う。Next.js 16 App Router + TypeScript + Drizzle ORM + Neon PostgreSQL(本番) + NextAuth v5(JWTセッション)。

- リポジトリ: `~/cami-order-system`、GitHub `camiordersystem-maker/cami`
- 詳細な機能索引は `AGENTS.md`（存在すれば）を先に見ること。ファイルの場所は基本的にそこに書いてある。
- 開発フロー・コミット規約は [CONTRIBUTING.md](CONTRIBUTING.md) を見ること。**`main`への直接コミットは禁止**、必ず`staging`経由。

## 2. インフラの現状（2026-08-31時点）

| 項目 | 状態 |
|---|---|
| ソース管理 | GitHub（`camiordersystem-maker/cami`）。GitLabへの移行は検討したが、無料プランの制約（5ユーザー/月400 CI分/10GB）よりも移行コストの方が大きいと判断し、**GitHubのまま**続行することにした。 |
| 本番ホスティング | 現在はVercel（`cami2026`プロジェクト、チーム`camiordersystem-maker`配下）。**Vercel Hobby(無料)プランは規約上商用利用不可**という理由でCloudflareへの移行作業を開始した。 |
| 本番DB | Neon PostgreSQL |
| ステージング環境 | Vercel Preview + 専用Neon DBブランチ（`staging`データベース）。詳細は`STAGING.md`。 |

## 3. Cloudflare移行の状況 — ここが一番重要

**まだ本番切替はしていない。** ローカルで`@opennextjs/cloudflare`を使い、Cloudflare Workersランタイムを再現して実機検証まで完了した段階。

**検証済み（動くことを確認済み）:**
- ビルド・起動
- ステージングDBへの接続
- ログイン（NextAuth credentials、bcrypt比較含む）
- 管理画面・一覧ページの複数回連続アクセス
- **注文作成トランザクション**（`pg_advisory_xact_lock`を使った二重送信防止、F-01対応）が同時リクエスト下でも正しく1件のみ作成することを確認

**見つけて直した2つの実バグ（両方とも`src/auth.config.ts` / `src/lib/db/index.ts`にコミント付きで残してある）:**

1. `UntrustedHost`エラー: NextAuthがエッジ実行環境のHostヘッダーを信頼しない設定だった。`trustHost: true`を追加して解決。
2. `Cannot perform I/O on behalf of a different request`: Cloudflare Workersは同じWorkerインスタンスが複数リクエストを処理し続けるが、**リクエストをまたいだI/O（DB接続等）の使い回しを禁止**している。従来の`src/lib/db/index.ts`はVercel向けにモジュールレベルでDB接続をキャッシュする作りだったため違反していた。`React.cache()` + `Proxy`で、既存の54ファイルの`import { db } from "@/lib/db"`という呼び出し方を変えずに、リクエスト単位の接続に切り替えて解決した。**この修正の仕組みを理解せずに`src/lib/db/index.ts`を触ると、Cloudflare上で同じ不具合が再発する可能性が高いので注意。**

**まだ終わっていないこと:**
- 実際のCloudflareアカウントへの本番デプロイ（アカウントは既に用意されている: Account ID `94e1c3350f8f37c6e0c5e14f39a3e4c5`、ワークスペース名「Cami.order.system...」。API Tokenの発行と、実際の`wrangler deploy`実行がまだ）
- `@vercel/blob`を使っているファイルアップロード機能（`src/app/api/admin/upload/route.ts`、1箇所のみ）はCloudflare上では動かない。Cloudflare R2などへの置き換えが必要（未着手）。
- 本番切替のタイミング判断（Vercel/Cloudflare並行稼働からどう移行するか）は未決定。

## 4. Vercel関連の紛らわしい点

- **`cami`と`cami2026`という2つのVercelプロジェクトが同じGitHubリポジトリに接続されている。** 本番として実際に使われているのは`cami2026`（本番URL: cami2026.vercel.app）。`cami`プロジェクトの用途は未確認・未解決のまま。Previewビルドが失敗する現象を確認済みだが、放置している（本番影響なしと判断）。
- Vercelの環境変数（`DATABASE_URL`/`AUTH_SECRET`等）は「Production and Preview」で共有設定されているものが多い。ステージング用に個別の値が必要な場合は、Vercelダッシュボードで**Custom Preview Branch**を指定した上書きエントリを追加する必要がある（通常のPreview全体への設定では既存の共有値と衝突する）。詳細は`STAGING.md`の「Existing cami2026 project env vars」節。

## 5. このMac固有の注意点（環境依存の落とし穴）

- **`gh auth`のアクティブアカウントは、このMac上で複数セッション/プロジェクト間で共有されている。** 別プロジェクトの作業中に`gh auth switch`されると、このリポジトリへのpushが403で失敗することがある。`gh auth status`で今どのアカウントがアクティブか確認し、必要なら`camiordersystem-maker`アカウント（このリポジトリの所有者）で認証し直すこと。
- Vercel CLIのログインアカウント（`shimacraft8-6355`）は、`camiordersystem-maker`チームのメンバーではない。Vercel側の設定変更はCLIから直接できないため、Vercelダッシュボードでの手作業が必要になる場面が多い。

## 6. ドキュメント索引

- `STAGING.md` — ステージング環境の作り方・環境変数一覧・既知の注意点
- `STAGING_DEPLOYMENT_NOTES.md` — `staging`ブランチの役割とリリースフロー
- `CONTRIBUTING.md` — ブランチ運用・コミット規約・PRの書き方
- `CAMI_BEGINNER_ACCESS_GUIDE.md` / `CAMI_SYSTEM_BEGINNER_HANDOVER.md` — 人間の初心者向け引き継ぎ書（2026-07-03時点、やや古い。ブランチ名など現状と食い違う記述があるので鵜呑みにしない）

## 7. 引き継ぎ時に真っ先に確認すべきこと

1. `git log --oneline -20` で直近の変更を把握する（このファイルより新しい情報がある可能性が高い）
2. `gh auth status` で正しいアカウントがアクティブか確認する
3. Cloudflare移行が完了しているか（`wrangler.jsonc`があるのは前提だが、実際に本番トラフィックがCloudflareに向いているかはVercel/Cloudflareダッシュボードで確認しないと分からない）
4. このファイル自体が古くなっていないか疑うこと。特に「4. Vercel関連」「5. このMac固有」の節は状況が変わりやすい。
