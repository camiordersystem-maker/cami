# Rollback

## Application Rollback

Use Vercel's previous successful production deployment rollback after confirming the failed release commit and impact window.

## Database Rollback

No destructive automatic rollback is configured. Before production migrations:

- Confirm Neon backup or restore point.
- Record migration files being applied.
- Prefer forward-fix migrations for schema changes.
- Do not restore production data without explicit operator approval.

## Stop Conditions

Stop release and do not continue if login, product browsing, admin dashboard, or non-destructive order flow checks fail.
