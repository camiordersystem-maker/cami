import assert from "node:assert/strict";
import { passwordFingerprint, readReviewAuthPolicy, reviewAccessAllowed, verifyReviewPassword, ReviewAuthUnavailable } from "../review-auth";

async function main() {
  const now = Date.parse("2026-11-18T01:00:00Z");
  const admin = { id: "fixture-admin", email: "fixture@cami-review.invalid", role: "viewer", isActive: true, password: "fixture-hash-not-a-real-password" };
  const policy = {
    version: 1 as const, environment: "staging" as const,
    baseUrl: "https://fixture.neonauth.ap-southeast-1.aws.neon.tech/staging/auth",
    adminId: admin.id, authUserId: "fixture-auth-user", email: admin.email,
    passwordFingerprint: await passwordFingerprint(admin.password), expiresAt: "2026-11-25T01:00:00.000Z",
  };
  assert.equal(readReviewAuthPolicy(undefined, "staging"), null);
  assert.deepEqual(readReviewAuthPolicy(JSON.stringify(policy), "staging"), policy);
  for (const changes of [{ environment: "production" }, { baseUrl: "http://fixture.neon.tech" }, { baseUrl: "https://evil.example" }, { baseUrl: "https://fixture.neon.tech?secret=x" }, { baseUrl: "https://user:secret@fixture.neon.tech" }, { role: "superadmin" }]) {
    assert.throws(() => readReviewAuthPolicy(JSON.stringify({ ...policy, ...changes }), "staging"), ReviewAuthUnavailable);
  }
  assert.equal(await reviewAccessAllowed(policy, admin, now), true);
  for (const changes of [{ isActive: false }, { role: "editor" }, { role: "superadmin" }, { id: "other" }, { email: "other@example.test" }, { password: "changed-hash" }]) {
    assert.equal(await reviewAccessAllowed(policy, { ...admin, ...changes }, now), false);
  }
  assert.equal(await reviewAccessAllowed(policy, admin, Date.parse(policy.expiresAt)), false);
  let calls = 0;
  const mock = (data: unknown, status = 200): typeof fetch => async (input, init) => {
    calls++;
    assert.equal(String(input), policy.baseUrl + "/sign-in/email");
    assert.equal(init?.redirect, "manual");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { email: admin.email, password: "fixture-password" });
    return Response.json(data, { status });
  };
  assert.equal(await verifyReviewPassword(policy, admin, "fixture-password", mock({ user: { id: policy.authUserId, email: admin.email }, token: "fixture-session-not-exposed" }), now), true);
  assert.equal(await verifyReviewPassword(policy, admin, "fixture-password", mock({ user: { id: "other", email: admin.email } }), now), false);
  assert.equal(await verifyReviewPassword(policy, admin, "fixture-password", mock({ user: { id: policy.authUserId, email: "other@example.test" } }), now), false);
  for (const status of [400, 401, 403]) assert.equal(await verifyReviewPassword(policy, admin, "fixture-password", mock({}, status), now), false);
  for (const status of [302, 429, 500, 503]) await assert.rejects(() => verifyReviewPassword(policy, admin, "fixture-password", mock({}, status), now), ReviewAuthUnavailable);
  await assert.rejects(() => verifyReviewPassword(policy, admin, "fixture-password", async () => { throw new Error("upstream secret must not escape"); }, now), (error: unknown) => error instanceof ReviewAuthUnavailable && !error.message.includes("upstream"));
  const before = calls;
  assert.equal(await verifyReviewPassword(policy, { ...admin, isActive: false }, "fixture-password", mock({}), now), false);
  assert.equal(await verifyReviewPassword(policy, admin, "fixture-password", mock({}), Date.parse(policy.expiresAt)), false);
  assert.equal(calls, before);
  console.log("Review auth: identity binding, viewer-only, expiry, revocation, password-change invalidation, redirect rejection and secret-safe failures PASS");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
