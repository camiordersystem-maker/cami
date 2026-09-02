# Staging Deployment Branch

This branch is where changes go before they reach production. It gives
Vercel's GitHub integration a persistent branch to build Preview deployments
from, using the staging-scoped environment variables and staging Neon
database (see `docs/STAGING.md`).

## Release flow

1. Commit fixes/features to `staging` (not directly to `main`).
2. Push. Vercel builds a Preview deployment from `staging` automatically.
3. Verify the change on the staging Preview URL.
4. Open a PR from `staging` into `main` and merge it. Vercel then builds a
   Production deployment from `main` automatically — this is the release.

Do not commit directly to `main` outside of this merge. A change that skips
`staging` has not been verified against the staging database/environment
before reaching production.

After merging into `main`, `staging` and `main` are identical again; keep
building the next round of changes on top of `staging` from there.
