# Production Release

Baseline process after RC2 Cloudflare Production release.

## Dependency maintenance (2026-11-11)

- Maintenance baseline: Next.js 16.4.6, OpenNext Cloudflare 1.20.16,
  Wrangler 4.160.0 and Zod 4.6.7, with Node 22.
- `glob` and `minimatch` overrides select patched build-tool dependencies;
  the `zod` override also covers the pinned Vercel CLI dependency.
  Recheck these overrides against upstream ranges during future upgrades.
- Never use an audit-recommended OpenNext downgrade or `npm audit fix --force`
  as a substitute for testing compatibility.
- Use the Cami GitHub identity only for this repository and an isolated Wrangler
  credential directory when the global Cloudflare login belongs to another project.
- Before deployment, independently verify account ID
  `94e1c3350f8f37c6e0c5e14f39a3e4c5` and Worker
  `cami-order-system-production`; always pass both targets explicitly.
- These dependency/source changes require no database schema migration.

## 1. Explicit approval

Production Worker deployは通常の開発作業に含めません。承認済みsource SHAと変更範囲を固定し、操作者の明示承認後に実施します。

DB migration、DNS/custom-domain、LINE設定、paid service等はProduction Worker deployとは別の承認範囲です。

## 2. Current platform

- Runtime: Cloudflare Workers / OpenNext
- Production DB: Neon PostgreSQL
- Current application entrypoint at RC2 release baseline: `https://cami-order-system-production.cami-order-system.workers.dev`
- Custom domain: separate cutover

旧Vercel前提のrelease記述を新しいreleaseへそのまま使用しないでください。

## 3. Pre-release gates

最低限:

1. target SHA / origin SHA一致
2. worktree clean
3. Node 22
4. clean dependency install
5. typecheck
6. lint
7. tests
8. secret scan
9. npm audit
10. Next build
11. OpenNext build
12. Production migration要否確認
13. current Production Worker version保存
14. rollback method確認

## 4. Database

migrationが不要なreleaseではProduction DB migrationを実行しません。

migrationが必要なreleaseでは、application deployと一緒に流れで実行するのではなく、schema compatibility / backup / read-only preflight / rollback方針を別途レビューします。

Production seedは禁止です。

## 5. Deployment

approved exact SHAからProduction Worker用artifactをbuildし、対象Worker名をdeploy直前に確認します。

STAGING Workerへ誤deployしないこと。

## 6. Post-deploy checks

最低限:

- active version
- `/api/health`
- `/api/readiness`
- `/login`
- admin authentication
- RBAC
- admin read-only business pages/APIs
- Production DB read-only sanity
- environment isolation
- LINE config
- upload expected state
- email expected state
- Cloudflare errors / 5xx

Production test orderは別途明示承認がない限り作りません。

## 7. Automatic rollback criteria

persistent health/readiness/login failure、admin login failure、DB identity mismatch、STAGING環境への誤接続、persistent 5xx、wrong source SHA等はrollback対象です。

DB変更のないapplication releaseでは旧Worker versionへ戻し、安易にDB restoreを行いません。

## 8. Evidence

releaseごとにsecret-free ReviewPackを保管します。

記録:

- approved SHA
- old/new Worker version
- build results
- deploy result
- smoke/auth/RBAC
- DB read-only results
- warnings
- rollback status
- command audit
- secret scan

## 9. Domain cutover

Application releaseとdomain cutoverを分離します。独自ドメイン導入は`ENVIRONMENTS_AND_RELEASE.md`に従って別工程とします。
