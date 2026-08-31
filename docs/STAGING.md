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

## Vercel access note

The CLI account used by automated tooling in this repo (`shimacraft8-6355`) is
**not** a member of the `camiordersystem-maker` Vercel team that owns the
`cami2026` project. `vercel --scope camiordersystem-maker` fails with
"the specified scope does not exist". Env var and Deployment Protection
changes on `cami2026` must be done manually in the Vercel dashboard by
someone with access to that team, or by inviting the automation account.

## Existing `cami2026` project env vars as of 2026-08-19 (key names only, values not visible/exported)

All of the following are scoped to **Production and Preview** (shared), set via
the Vercel dashboard / Neon integration. Because Preview shares these by
default, any Preview deployment (including staging) inherits production
values unless overridden per-branch:

- `AUTH_SECRET`, `NEXTAUTH_URL` — **must** override for the `staging` branch
  (Preview + Custom Preview Branch = `staging`), otherwise sessions/tokens mix
  with production.
- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL`, `POSTGRES_URL_NO_SSL`,
  `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`,
  `POSTGRES_HOST`, `POSTGRES_USER`, `NEON_PROJECT_ID` — Neon-integration-injected.
  **Must** override `DATABASE_URL` for the `staging` branch. The `vercel-build`
  script runs migrations at build time (`src/lib/db/migrate.pg.ts`), so a build
  that succeeds without this override has just migrated against production
  (harmless if idempotent, but any later staging test traffic would hit real
  production data).
- `RESEND_API_KEY` — safe to leave shared. `src/lib/email.ts` suppresses actual
  sends whenever `VERCEL_ENV === "preview"` (true for all Preview deployments
  regardless of `APP_ENV`), so Preview never sends real email even without
  `STAGING_EMAIL_MODE` set.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — production bootstrap-admin seed values, not
  read by `seed-staging.ts`. Safe to leave shared; irrelevant to staging.
- `BANK_NAME`, `BANK_BRANCH`, `BANK_ACCOUNT_TYPE`, `BANK_ACCOUNT_NUMBER`,
  `BANK_ACCOUNT_NAME` — display-only content (bank transfer info shown to
  customers). Safe to leave shared; no isolation concern.

New vars added for staging (Preview + branch `staging`): `APP_ENV=staging`,
`NEXT_PUBLIC_APP_ENV=staging`, `STAGING_EMAIL_MODE=suppress`.
