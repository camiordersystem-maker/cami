# Incident Response

## Initial Triage

- Identify affected function: login, order, inventory, billing, email, or admin.
- Capture request IDs and timestamps.
- Stop risky operations if inventory, billing, or data integrity is affected.
- Do not run destructive database commands without explicit operator approval.

## Common Incidents

- Order failure: check inventory consistency and email send logs.
- Login failure: check auth secret, user status, and rate of failed attempts.
- Migration failure: stop deploy, confirm restore point, and inspect schema state.
- Email failure: keep order state; resend manually once provider status is known.

## Data Exposure

If personal information exposure is suspected, preserve logs, rotate secrets as needed, and prepare an affected-record assessment before further changes.
