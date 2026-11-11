# Security and Non-functional Specification

## 1. Authentication

- Auth.js Credentials Provider。
- bcrypt password verification。
- admin/member共通login入口。
- memberはstatus=approvedのみlogin可能。
- JWT session。
- session max age: 14日。

## 2. Login abuse protection

`src/auth.ts`でemailをkeyとするrate limitを利用。

現行実装値: 10 attempts / 15 minutes。

新規登録にもrate limit実装があります。正確な値はroute sourceを確認してください。

## 3. Authorization

- UI表示制御だけに依存しない。
- APIでroleを検証。
- viewer writeを`requireEditor`で拒否。
- high privilegeを`requireSuperAdmin`で保護。
- member resourceはmemberId ownership scopeを確認。

## 4. Cross-site mutation

`src/proxy.ts`でAPI write requestのcross-site判定を実施。

- safe methods: GET / HEAD / OPTIONS
- Auth.jsとLINE webhookは個別認証のため除外
- `Sec-Fetch-Site: cross-site`を拒否
- Originがapp originと異なる場合を拒否

## 5. Security headers

ProductionでHSTS:

`Strict-Transport-Security: max-age=31536000; includeSubDomains`

## 6. LINE webhook

raw request body + channel secretでHMAC SHA-256署名を作成し、`X-Line-Signature`をconstant-time比較します。

## 7. Input / file validation

- zodを主要mutationで利用。
- Product image: MIME whitelist、3MB limit。
- user-controlled filenameからextensionを決めない。
- email HTML user valueをescape。

## 8. Data integrity

- PostgreSQL transactionを注文/在庫等で利用。
- order number / invoice number unique constraint + collision retry。
- duplicate order suppression。
- optimistic lockingによるstatus concurrent update保護。
- invoice_orders snapshotによるinvoice immutable-view整合性。

## 9. Auditability

`audit_logs`、`order_status_histories`、`inventory_movements`を用途別に保持。

新しいwrite pathにはaudit/history/ledgerの要否を必ずレビューします。

## 10. Secret hygiene

- secretはenvironment variable / platform secrets。
- docs、logs、ReviewPackへvalueを載せない。
- `npm run scan:secrets`をquality gateへ含める。
- manual screenshotはProduction実顧客データを利用しない。

## 11. Environment isolation

STAGING / Productionについて少なくとも以下を分離:

- Worker
- DB
- LINE
- SITE URL / APP ENV
- secrets

manual screenshotもSTAGINGを標準とします。

## 12. Availability / release checks

- `/api/health`
- `/api/readiness`
- Production post-deploy smoke
- active Worker version確認
- rollback target確保

## 13. Runtime constraints

Cloudflare Workers + OpenNextのNode middleware supportにはplatform adapter由来のexperimental warningが発生し得ます。warning自体とapplication failureを区別し、release evidenceで継続監視します。

## 14. Performance / scale

現行は比較的小規模なBtoB運用を想定した実装です。大規模load/chaosは通常のfunctional release gateとは別途実施します。

性能劣化が疑われる場合は、DB query/index、Cloudflare Worker log、Neon connection、API latencyを計測し、推測で最適化しません。
