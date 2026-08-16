# Cami Order System

BtoB ordering system for Cami headquarters and franchise/member stores.

## Current Status

Production readiness: `NOT READY`

The app builds and includes core order, member, product, inventory, terms, announcement, administrator, and monthly invoice screens. Remaining blockers are documented in `docs/PRODUCTION_RELEASE.md`, `docs/STAGING.md`, and `docs/OPERATIONS.md`.

## Local Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run preflight
```

`npm run build` runs Next.js with `NODE_ENV=production`, which triggers the
same production DB guard described below — **it intentionally fails against
the local SQLite database.** To verify the production build compiles, run it
with a dummy PostgreSQL URL instead:

```bash
export DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
export AUTH_SECRET="dummy-secret"
npm run build
```

## Database

Local development uses SQLite when `DATABASE_URL` is not PostgreSQL.

Production must use PostgreSQL. Runtime startup fails in production (including
local `npm run build`, since that also sets `NODE_ENV=production`) if:

- `DATABASE_URL` is missing.
- `DATABASE_URL` does not point to PostgreSQL.
- `AUTH_SECRET` or `NEXTAUTH_SECRET` is missing.

`vercel-build` intentionally runs only `next build`; seeds are not run during production builds.

## Release

Do not production deploy from this prompt/run.

The production release process is locked until the operator explicitly says:

`現在のを本番環境にプッシュ`

See `docs/PRODUCTION_RELEASE.md` and `docs/ROLLBACK.md`.

## Billing Boundary

The current invoice feature is a monthly aggregate invoice, not a complete production billing workflow. Until invoice snapshots, PDF/email, revision history, payment history, and correction handling are implemented, billing must be completed outside the system.
