# Production Release

Production release is locked until the operator explicitly requests:

`現在のを本番環境にプッシュ`

Before that instruction, do not push to `main`, deploy Production, run Production DB migrations, or seed Production data.

## Current Gate

Run:

```bash
npm run preflight
```

The release gate checks repository state, lint, typecheck, business-rule tests, schema verification, and production build.

`npm run release:production` is intentionally locked unless `CONFIRM_PRODUCTION_RELEASE=true` is set. It currently performs gates only; GitHub/Vercel/DB production automation still requires project-specific credentials and final operator confirmation.

## Required Before READY

- Confirm Vercel Preview and Production projects/environments.
- Confirm Neon staging and production database separation.
- Add migration dry-run and production schema verification against staging PostgreSQL.
- Add E2E tests and non-destructive production smoke tests.
- Confirm backup/restore point before any production migration.
- Keep `vercel-build` free of seed commands.
