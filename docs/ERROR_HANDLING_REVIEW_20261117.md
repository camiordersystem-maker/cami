# Error Handling Review - 2026-11-17

Scope: login waiting and administrator inventory editing. No database migration.

- Login waiting is bounded at 15 seconds. A deadline does not imply server cancellation.
- Inventory reads and updates have 15-second request deadlines, including body reading.
- Inventory and receipt response shapes are validated before entering UI state.
- An immediate ref guard prevents repeated save submissions before React state updates.
- Network errors and 5xx updates have an unknown outcome. Never automatically resend them.
- Unknown outcomes close editing and reread inventory/history. Failed reloads block editing.
- Existing expectedAvailableBoxes conflict checks, required reasons and role guards remain.

Verification: typecheck, lint, all npm test suites, secret scan, dependency audit,
documentation check, OpenNext build, Wrangler dry run, and isolated browser fixtures.
Browser fixtures are not live Production authentication or business end-to-end evidence.

Release remains separate from validation: use only Cami's verified account and Worker.
Do not switch shared CLI accounts or deploy to Nuu. No Production data, DNS, Vercel,
R2, email, LINE settings or cloud deployments were changed during this review.

Remaining scope: React 19 compatibility work before Next 17; production read-only
regression after deployment; broader forms/network coverage beyond these screens.
