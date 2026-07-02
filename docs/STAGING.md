# Staging

Staging must be isolated from production.

Required settings:

- Dedicated Vercel Preview or staging URL.
- Dedicated Neon staging database.
- Dedicated `DATABASE_URL` and `AUTH_SECRET`.
- `APP_ENV=staging` and `NEXT_PUBLIC_APP_ENV=staging`.
- `STAGING_EMAIL_MODE=suppress` or `STAGING_EMAIL_MODE=redirect` with `STAGING_EMAIL_TO`.
- No production data copy.

The UI displays `ステージング環境` when `NEXT_PUBLIC_APP_ENV=staging` or Vercel Preview is active.

## Seed

Run only against staging-like database hosts/names. The command refuses production and refuses non-staging names unless `ALLOW_NON_STAGING_DB=true` is intentionally set.

```bash
npm run db:migrate:pg
npm run seed:staging
```

The seed creates superadmin/editor/viewer accounts, approved/pending/suspended/rejected members, active/inactive products, stock/empty/low-stock inventory, shipping addresses, and a published terms record.

## Reset

```bash
CONFIRM_STAGING_RESET=true npm run reset:staging
npm run seed:staging
```

Reset deletes only staging-pattern dummy records such as `stage-%@example.com`, `stage-%` products, and `STAGE-%` orders/invoices. It does not perform database-wide deletes.

## Verification

```bash
npm run db:verify
npm run preflight
```

Production/staging DB separation still must be confirmed in Vercel and Neon dashboards or via CLI with secrets hidden.
