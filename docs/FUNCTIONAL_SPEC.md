# Functional Specification

Baseline: RC2 `dcde0d0ce4dea0a4b17f4204a4556ee14a2c849c`

## 1. Authentication / account

| Function | Actor | Main behavior |
|---|---|---|
| Login | member/admin | email+passwordで認証。admin/memberを判定してrole別画面へ遷移 |
| New member application | public | 会員申請をpendingで登録し、本部審査対象にする |
| Member password change | member | 現在パスワード確認後に変更 |
| Admin account management | superadmin | 管理者作成・編集・権限・active状態管理 |

## 2. Member ordering

| Function | Main behavior |
|---|---|
| Product catalog | active商品、在庫、ランク適用単価を表示 |
| Quantity selection | 箱単位。0は注文対象外、在庫超過を拒否 |
| Shipping address selection | 自分の未削除配送先のみ利用 |
| Terms enforcement | 最新公開約款がある場合、最新版同意済みでなければ注文拒否 |
| Order calculation | rank rate、商品定価、入数、税率から金額計算 |
| Order creation | order/header/items/inventory/ledger/history/auditを整合的に作成 |
| Duplicate suppression | Production PGで会員単位lock + 短時間同一注文判定 |
| Post-commit notification | 注文成立後にemail/LINE。通知失敗は注文をrollbackしない |
| Quick reorder | feature flag有効時に過去注文を再読込 |
| CSV bulk order | feature flag有効時に商品名・箱数CSVを読込 |

## 3. Order lifecycle

| From | To | Actor / condition |
|---|---|---|
| pending | confirmed | admin/editor |
| confirmed | shipped | admin/editor、追跡番号必要 |
| shipped | delivered | admin/editor |
| pending/confirmed | cancel_requested | member |
| cancel_requested | cancelled | admin/editor承認、在庫返却 |
| cancel_requested | previous status | admin/editor却下 |
| pending/confirmed | cancelled | admin側直接キャンセル可能な経路あり。実API遷移ルールを参照 |

## 4. Inventory

- 商品ごとにavailable boxesを管理。
- 注文時に減算。
- キャンセル承認時に返却。
- 管理者による手動調整。
- 在庫移動台帳へ理由・before/afterを記録する設計。
- 低在庫閾値はシステム設定と機能に利用。
- dashboard / inventory画面で在庫警告を表示。

## 5. Billing

- 会員・年月単位で月次請求書を発行。
- 対象注文はconfirmed/shipped/delivered。
- 同一会員・同一年月の重複発行を拒否。
- invoice_ordersへ発行時対象注文をsnapshot。
- 支払状態: unpaid / paid / overdue。
- 印刷画面を提供。
- email送付はfeature flagとメール設定に依存。

## 6. Member management

- pending申請一覧・詳細。
- approved / rejected / suspended等へstatus変更。
- rank割当。
- 配送先や関連注文の確認。
- 監査ログへの導線。

## 7. Product management

- 商品名、説明、画像URL、定価、入数、active状態。
- image upload APIはstorage設定に依存。
- Cloudflare Workersでstorage未設定の場合は503 `STORAGE_NOT_CONFIGURED`。

## 8. Rank management

- rank名、rate、月間箱数基準、説明。
- memberの注文単価へrank rateを適用。

## 9. Terms

- 本部: 下書き保存、公開。
- 店舗: 公開版閲覧、同意。
- 最新公開版への同意を注文条件として利用。

## 10. Announcements / notifications

- 全体または個別お知らせ。
- 有効期限。
- member read tracking。
- menu未読badge。
- system notification banner。

## 11. Feature flags

追加機能をDB flagでON/OFF。正式一覧は`src/lib/constants.ts`。

## 12. Audit

重要mutationを`audit_logs`へ記録。actor、action、target、before/after、IP、日時を保持する設計。

## 13. Health / readiness

- `/api/health`: application health
- `/api/readiness`: DB疎通を含むreadiness

Production monitoringやrelease smokeで利用します。
