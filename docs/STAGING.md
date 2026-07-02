# Staging

Staging must be isolated from production.

Required settings:

- Dedicated Vercel Preview or staging URL.
- Dedicated Neon staging database.
- Dedicated environment variables.
- No production data copy.
- Email sandbox, suppression, or fixed test recipients.
- Visible staging banner in the UI.

Dummy data must be idempotent and must refuse to run against production.

This repository does not yet include a complete staging reset command; production readiness remains `NOT READY` until staging PostgreSQL tests pass.
