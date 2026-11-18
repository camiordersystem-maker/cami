# Business Flows

## 1. 会員登録

```text
店舗
  ↓ 新規登録申請
members.status = pending
  ↓
本部が申請内容を確認
  ├─ approved → ログイン可能
  └─ rejected → ログイン不可
```

登録APIはIP単位のレート制限を持ちます。本部の審査結果に応じてメール送信処理がありますが、実送信可否は環境設定に依存します。

## 2. 約款同意

最新の公開約款が存在する場合、店舗はその版へ同意してから注文します。

注文APIは最新公開約款と会員の最新同意レコードを照合し、不一致なら409で注文を拒否します。

## 3. 通常注文

```text
商品・箱数選択
  ↓
配送先選択
  ↓
在庫確認 / 商品販売状態確認 / ランク確認 / 約款確認
  ↓
価格・税計算
  ↓
注文transaction
  ├─ orders
  ├─ order_items
  ├─ inventory減算
  ├─ inventory_movements
  ├─ order_status_histories
  └─ audit_logs
  ↓ COMMIT
メール / LINE通知（失敗しても注文は成立済み）
```

### 重複送信対策

Production PostgreSQLでは会員単位のadvisory transaction lockを取り、直近10秒の同一配送先・同一金額・同一商品構成の注文が存在する場合に新規注文を重ねないロジックがあります。

## 4. 注文ステータス

正規フロー:

```text
pending → confirmed → shipped → delivered
```

発送へ進める際は追跡番号が必要です。

不正な飛び越し遷移は拒否します。ステータス変更では楽観ロックを利用する実装があり、同時操作による上書きを防ぎます。

## 5. キャンセル

### 店舗申込

`pending`または`confirmed`から`cancel_requested`へ申込できます。理由は画面から任意入力できますが、状態遷移側ではキャンセル系の理由要否ルールも存在するため、API実装をsource of truthにしてください。

### 本部承認

```text
cancel_requested
  ↓ approve
cancelled
  + 在庫返却
  + 在庫移動記録
  + status history / audit
```

### 本部却下

キャンセル申込前に保存した状態へ復元します。在庫返却は行いません。

## 6. 月次請求書

本部が会員・年・月を選択して発行します。

対象注文:

- confirmed
- shipped
- delivered

同一会員・同一年月の既存請求書がある場合は409です。

請求書作成時に対象注文を`invoice_orders`へ固定します。これにより後日注文ステータスが変わっても発行済み請求書の内訳を維持します。

支払期限は対象月の翌月末を計算します。

## 7. 支払ステータス

`monthly_invoices.payment_status`で少なくとも次の値を扱います。

- unpaid
- paid
- overdue

画面/APIのzod validationをsource of truthとします。

期限超過アラート機能がONの場合、通知・メール処理が実行される経路があります。

## 8. 在庫

在庫は箱単位です。

主な増減理由:

- initial
- inbound
- order_allocation
- cancellation_return
- manual_adjustment
- return
- correction

正確なDB制約は`generated/DATABASE_SCHEMA.md`を参照してください。

## 9. お知らせ

本部から:

- 全会員向け
- 個別会員向け

のお知らせを作成できます。有効期限を持てます。店舗が開くと既読テーブルへ記録され、サイドメニューの未読件数表示に利用されます。

## 10. 監査

重要なwrite操作は`audit_logs`へ記録する設計です。新しいmutationを追加した場合は、監査記録の有無と`src/lib/constants.ts`の日本語ラベル追加をDefinition of Doneとして確認してください。
