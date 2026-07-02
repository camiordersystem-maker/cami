# Cami受発注システム 自動化マトリクス

作成日: 2026-07-03
対象ブランチ: codex/local-complete-and-handover

| 項目 | コマンド/場所 | 自動化状況 | 今回の結果 | 人間の確認 |
|---|---|---:|---|---|
| Docker起動 | `npm run local:start` | 済 | PostgreSQL/Mailpit起動確認済み | Docker Desktopの起動状態 |
| 初回セットアップ | `npm run local:setup` | 済 | 成功 | ログイン確認 |
| ローカルマイグレーション | `npm run local:migrate` | 済 | 成功 | 新規migration追加時のレビュー |
| 初期データ投入 | `npm run local:seed` | 済 | 成功 | ダミー値を本番に流さない |
| DBリセット | `CONFIRM_LOCAL_RESET=true npm run local:reset` | 済 | 成功 | ローカルDBであること |
| DB検証 | `npm run local:verify` | 済 | 成功 | 件数の妥当性 |
| バックアップ | `npm run local:backup` | 済 | 成功 | 保存先容量、世代管理 |
| 復元 | `RESTORE_FILE=... CONFIRM_LOCAL_RESTORE=true npm run local:restore` | 済 | 成功 | 復元対象がローカルDBであること |
| ローカル疎通 | `LOCAL_APP_URL=... npm run local:smoke` | 済 | 成功 | 主要業務フローは別途画面確認 |
| lint | `npm run lint` | 済 | 成功、警告0 | UI品質は画面確認 |
| 型チェック | `npm run typecheck` | 済 | 成功 | 型では表現できない業務ルール |
| 単体テスト | `npm test` | 一部 | 成功 | E2E不足を手動確認で補完 |
| DBスキーマ検証 | `npm run db:verify` | 済 | 成功 | migrationレビュー |
| preflight | `npm run preflight` | 済 | 成功、build成功 | 外部サービス設定 |
| 秘密情報スキャン | `npm run scan:secrets` | 済 | 成功 | 本番環境変数の目視確認 |
| npm audit | `npm audit --audit-level=moderate` | 済 | 6件検出（critical 1、moderate 5） | 本番前に依存関係更新と再検証が必須 |
| 注文フロー | 画面操作 | 未 | 自動E2E未整備 | 必須 |
| キャンセルフロー | 画面操作 | 未 | 自動E2E未整備 | 必須 |
| 請求書表示 | 画面/印刷 | 未 | 自動视觉検査なし | 必須 |
| メール送信 | Mailpit/本番メール | 一部 | ローカル受信先あり | 本番DNS/API確認 |
| Production deploy | Vercel | 未 | 実施禁止 | 承認後のみ |

## 次に自動化したいこと
1. Playwrightで会員登録、承認、注文、キャンセル、請求書発行までのE2Eを作る。
2. 請求書と納品書のPDF/印刷レイアウトをスクリーンショット比較する。
3. メール文面をMailpit APIで取得して検証する。
4. 本番公開前の環境変数チェックをVercel向けに強化する。
5. バックアップ世代管理と古いバックアップ削除の運用を決める。
