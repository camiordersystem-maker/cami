import assert from "node:assert/strict";
import { passwordFingerprint } from "../review-auth";
import { ManagedAuthUnavailable, managedAccessAllowed, readManagedPolicy, verifyManagedPassword } from "../managed-auth";

async function main() {
  const hash = await passwordFingerprint("fixture-only-hash");
  const principal = { kind: "admin" as const, adminRole: "editor" as const, localId: "hq", authUserId: "auth-hq", email: "hq@example.test", passwordFingerprint: hash };
  const member = { kind: "member" as const, localId: "store", authUserId: "auth-store", email: "store@example.test", passwordFingerprint: hash };
  const policy = { version: 1 as const, environment: "staging" as const, baseUrl: "https://fixture.neonauth.aws.neon.tech/auth", principals: [principal, member] };
  const user = { id: "hq", email: principal.email, password: "fixture-only-hash", role: "editor", isActive: true };
  const store = { id: "store", email: member.email, password: "fixture-only-hash", status: "approved" };
  assert.equal(readManagedPolicy(undefined, "staging"), null);
  assert.deepEqual(readManagedPolicy(JSON.stringify(policy), "staging"), policy);
  for (const changes of [{ environment: "production" }, { baseUrl: "http://fixture.neonauth.neon.tech" }, { baseUrl: "https://evil.example" }, { baseUrl: "https://fixture.neonauth.neon.tech?x=1" }, { principals: [principal, principal] }, { principals: [{ ...principal, adminRole: "superadmin" }] }]) assert.throws(() => readManagedPolicy(JSON.stringify({ ...policy, ...changes }), "staging"), ManagedAuthUnavailable);
  assert.equal(await managedAccessAllowed(principal, user, "admin"), true);
  assert.equal(await managedAccessAllowed(member, store, "member"), true);
  for (const changes of [{ role: "viewer" }, { role: "superadmin" }, { isActive: false }, { id: "other" }, { email: "other@example.test" }, { password: "changed" }]) assert.equal(await managedAccessAllowed(principal, { ...user, ...changes }, "admin"), false);
  for (const status of ["pending", "rejected", "suspended"]) assert.equal(await managedAccessAllowed(member, { ...store, status }, "member"), false);
  assert.equal(await managedAccessAllowed(member, store, "admin"), false);
  let calls = 0;
  const mock = (data: unknown, status = 200): typeof fetch => async (url, init) => {
    calls++; assert.equal(String(url), policy.baseUrl + "/sign-in/email"); assert.equal(init?.redirect, "manual");
    assert.deepEqual(JSON.parse(String(init?.body)), { email: principal.email, password: "fixture-password" });
    return Response.json(data, { status });
  };
  assert.equal(await verifyManagedPassword(policy, principal, user, "fixture-password", mock({ user: { id: principal.authUserId, email: principal.email } })), true);
  assert.equal(await verifyManagedPassword(policy, principal, user, "fixture-password", mock({ user: { id: "other", email: principal.email } })), false);
  for (const status of [400, 401, 403]) assert.equal(await verifyManagedPassword(policy, principal, user, "fixture-password", mock({}, status)), false);
  for (const status of [302, 429, 500, 503]) await assert.rejects(() => verifyManagedPassword(policy, principal, user, "fixture-password", mock({}, status)), ManagedAuthUnavailable);
  await assert.rejects(() => verifyManagedPassword(policy, principal, user, "fixture-password", async () => { throw new Error("secret-detail"); }), (e: unknown) => e instanceof ManagedAuthUnavailable && !e.message.includes("secret-detail"));
  const before = calls;
  assert.equal(await verifyManagedPassword(policy, principal, { ...user, isActive: false }, "fixture-password", mock({})), false);
  assert.equal(calls, before);
  console.log("Managed operations auth: editor/member identity binding, deactivation, suspension, hash revocation, no role escalation, no fallback, secret-safe failures PASS");
}
main().catch(e => { console.error(e); process.exitCode = 1; });
