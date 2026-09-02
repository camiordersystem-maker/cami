# Operations

Baseline: RC2 `dcde0d0ce4dea0a4b17f4204a4556ee14a2c849c`

本書は現在のCami受発注システムの日常運用上の注意点をまとめます。具体的な操作はシステム内`/help` / `/admin/help`を正本とします。

## 1. Order operations

本部は`/admin/orders`を起点に処理します。

標準:

```text
pending → confirmed → shipped → delivered
```

- 発送時は追跡番号を確認。
- 不正なstatus飛び越しは行わない。
- 問い合わせ時は注文詳細と監査ログ/status historyを確認。

## 2. Cancellation

店舗が`pending`または`confirmed`注文からキャンセル申込を行います。

本部:

- 承認 → cancelled + 在庫返却
- 却下 → 申込前statusへ復元

承認時は在庫が自動返却されるため、同じ数量を手動在庫調整で戻さないでください。

## 3. Inventory

`/admin/inventory`で実在庫との整合を管理します。

- 注文: 自動減算
- キャンセル承認: 自動返却
- 入庫/棚卸差異: 管理者調整

手動調整時は理由・メモを残します。在庫台帳`inventory_movements`は障害調査・差異調査の重要証跡です。

## 4. Billing

現行の利用画面は`monthly_invoices`を中心とする月次請求です。

- 会員 + 年月で発行
- confirmed / shipped / delivered注文を対象
- 同月重複発行を拒否
- 発行時対象注文を`invoice_orders`へsnapshot
- payment statusをunpaid / paid / overdueで管理
- browser印刷/PDF保存が可能

請求書emailはfeature flagとemail provider設定に依存します。

`invoices / invoice_items / payments`という別の拡張schemaも存在するため、保守時に`monthly_invoices`系と混同しないでください。

### システム外運用が必要な領域

コード上、返品・返金・credit note・請求訂正専用workflowは主要画面として完成していません。これらは別途業務判断・手順で扱い、安易に注文/請求データを直接書き換えないでください。

## 5. Terms

本部が公開した最新約款へ店舗が同意していることが注文条件です。

約款を更新・公開すると注文可否へ影響するため、正式文面の承認後に公開してください。

## 6. Member operations

会員申請はpendingで入り、本部審査後approvedになった会員だけがログインできます。

suspended / rejectedはログイン不可です。

rank変更は将来の注文価格に影響するため、適用ルールを確認して変更してください。

## 7. Announcements / notifications

お知らせは全体/個別で配信できます。店舗側の未読badgeはread trackingに基づきます。

システム通知とemail/LINEは用途が異なります。通知provider失敗とbusiness transaction成功を区別して調査します。

## 8. LINE

新規注文のLINE通知は注文COMMIT後に実行されます。

LINE障害で注文自体を失敗扱いにしません。注文が成立しているかをDB/管理画面で先に確認し、その後notification log/providerを調査します。

## 9. Email

- Local / key未設定: 実送信なし
- STAGING: default suppress
- Production: provider設定時のみ実送信

Productionでemail disabled運用の場合、機能を有効化する変更は別途承認対象です。

## 10. Product image upload

Cloudflare Workersで永続storage未設定の場合:

`503 STORAGE_NOT_CONFIGURED`

は期待動作です。

storageを導入するまでは、画像uploadを必須業務として扱わないでください。

## 11. Health checks

- `/api/health`
- `/api/readiness`

障害時はhealthだけでなくreadiness、Worker log、DB接続、business APIを分けて確認します。

## 12. Incident

データ整合性に関係する障害では、修正より先に影響範囲と現在値を保存します。

詳細: `INCIDENT_RESPONSE.md`

## 13. Manual / docs

UIや業務仕様を変更したら`DOCUMENTATION_POLICY.md`に従い、manualとdocsを同一変更内で更新します。
