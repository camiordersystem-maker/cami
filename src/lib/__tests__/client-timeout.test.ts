import assert from "node:assert/strict";
import { withDeadline } from "../client-timeout";

async function main() {
  assert.equal(await withDeadline(Promise.resolve("ok"), 20), "ok");
  await assert.rejects(withDeadline(Promise.reject(new Error("network")), 20), /network/);
  await assert.rejects(withDeadline(new Promise<never>(() => {}), 5), /REQUEST_TIMEOUT/);
  let settled = false;
  const request = new Promise<string>((resolve) => setTimeout(() => { settled = true; resolve("committed"); }, 20));
  await assert.rejects(withDeadline(request, 1), /REQUEST_TIMEOUT/);
  await request;
  assert.equal(settled, true);
  console.log("Client deadlines: 4 checks PASS (timeout never implies rollback)");
}
main().catch(() => { console.error("Client deadlines: FAIL"); process.exitCode = 1; });
