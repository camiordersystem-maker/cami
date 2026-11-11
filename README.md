# Cami Order System

Cami本部と加盟店・取引先のためのBtoB受発注システムです。

Documentation baseline: RC2 `dcde0d0ce4dea0a4b17f4204a4556ee14a2c849c`

## Current State

2026-09-02時点のRC2 application releaseはProductionへ反映済みです。Production DB migrationは不要なreleaseとして検証され、custom domain / DNS cutoverは別工程です。

現在のProduction application entrypoint:

`https://cami-order-system-production.cami-order-system.workers.dev`

## Documentation

まず `docs/README.md` を開いてください。

特に:

- `docs/SYSTEM_OVERVIEW.md`
- `docs/ARCHITECTURE.md`
- `docs/BUSINESS_FLOWS.md`
- `docs/ROLES_AND_PERMISSIONS.md`
- `docs/DATA_MODEL.md`
- `docs/API_SPEC.md`
- `docs/INTEGRATIONS.md`
- `docs/ENVIRONMENTS_AND_RELEASE.md`
- `docs/MANUAL_MAINTENANCE.md`
- `docs/DOCUMENTATION_POLICY.md`

コードから生成するroute/API/DB/migration一覧は`docs/generated/`にあります。

```bash
npm run docs:generate
npm run docs:check
```

## In-app Manual

利用者マニュアルはシステム内に組み込みます。

- 店舗: `/help`
- 本部: `/admin/help`
- 主要画面: `？ この画面の使い方`

本文は`src/lib/manual.ts`でGit管理します。画面キャプチャはSTAGINGから自動取得する構成です。

```bash
npm run manual:capture
```

詳細は`docs/MANUAL_MAINTENANCE.md`を参照してください。

## Stack

- Next.js 16 App Router / webpack
- TypeScript
- React 18
- Tailwind CSS 4
- Auth.js / NextAuth v5
- Drizzle ORM
- PostgreSQL / Neon (Production)
- Cloudflare Workers / OpenNext
- SQLite / local PostgreSQL development paths
- LINE Messaging API
- Resend integration

## Common Development Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run scan:secrets
npm run build
npm run docs:generate
npm run docs:check
```

## Database

Runtime schema selection is handled by `src/lib/db/schema.ts`.

- PostgreSQL: `schema-pg.ts`
- SQLite fallback: `schema-sqlite.ts`

Production runtime must use PostgreSQL and requires an Auth secret. Production DB write/migration must never be performed as an incidental side effect of normal documentation or UI work.

## Release Safety

Production deploy, Production DB mutation/migration, DNS/custom-domain changes, LINE configuration writes, storage creation, and paid-service changes are separate controlled operations.

Use the release and rollback runbooks under `docs/` and require explicit scope approval before changing Production.
