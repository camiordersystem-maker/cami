export const TAX_RATE = 0.10;
export const INVENTORY_WARNING_THRESHOLD = 10;

export const NOTIFICATION_TYPES = {
  INVOICE_ISSUED: "invoice_issued",
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_SHIPPED: "order_shipped",
  PAYMENT_OVERDUE: "payment_overdue",
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type AnnouncementType = "all" | "individual";

// スーパー管理者が管理画面から個別にON/OFFできる追加機能。
// キーはDBの feature_flags.key と一致させる。デフォルトは全て無効。
export const FEATURE_FLAGS = {
  PAYMENT_OVERDUE_ALERTS: "payment_overdue_alerts",
  QUICK_REORDER: "quick_reorder",
  INVOICE_PDF_EMAIL: "invoice_pdf_email",
  CSV_BULK_ORDER: "csv_bulk_order",
  LOW_STOCK_BADGE: "low_stock_badge",
  ANNOUNCEMENT_EMAIL: "announcement_email",
  MEMBER_ORDER_CSV_EXPORT: "member_order_csv_export",
} as const;

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

export const FEATURE_FLAG_DEFINITIONS: Array<{ key: FeatureFlagKey; label: string; description: string }> = [
  { key: FEATURE_FLAGS.PAYMENT_OVERDUE_ALERTS, label: "支払期限超過アラート", description: "請求書の支払期限を過ぎると管理ダッシュボードに警告を表示し、会員へ通知します。" },
  { key: FEATURE_FLAGS.QUICK_REORDER, label: "再注文（クイックオーダー）", description: "会員が過去の注文と同じ内容をワンクリックで再発注できるようにします。" },
  { key: FEATURE_FLAGS.INVOICE_PDF_EMAIL, label: "請求書PDF出力・メール送付", description: "月次請求書の印刷用ページと、会員へのメール送付ボタンを管理画面に表示します。" },
  { key: FEATURE_FLAGS.CSV_BULK_ORDER, label: "CSV一括発注", description: "会員が商品名・箱数のCSVをアップロードして一括発注できるようにします。" },
  { key: FEATURE_FLAGS.LOW_STOCK_BADGE, label: "低在庫バッジ表示（会員向け）", description: "会員の商品一覧に「残りわずか」バッジを表示します。" },
  { key: FEATURE_FLAGS.ANNOUNCEMENT_EMAIL, label: "お知らせのメール通知", description: "お知らせ作成時に対象会員へメールでも通知します。" },
  { key: FEATURE_FLAGS.MEMBER_ORDER_CSV_EXPORT, label: "会員向け注文CSVダウンロード", description: "会員が自分の注文履歴をCSVでダウンロードできるようにします。" },
];
