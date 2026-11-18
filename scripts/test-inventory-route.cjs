/* eslint-disable @typescript-eslint/no-require-imports -- Isolated CommonJS loader mocks auth/DB before loading the route. */
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');
const oldResolve = Module._resolveFilename;
const oldLoad = Module._load;
const oldTs = require.extensions['.ts'];
const previousDatabaseUrl = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;
let role = 'editor';
let writes = 0;
const fixtureDb = {
  select: () => ({ from: () => ({ where: async () => [{ availableBoxes: 19 }] }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: async () => { writes++; return [{ id: 'fixture-stock' }]; } }) }) }),
  insert: () => ({ values: async () => { writes++; } }),
};
Module._resolveFilename = function(name, parent, ...args) {
  if (name.startsWith('@/')) name = path.join(process.cwd(), 'src', name.slice(2));
  return oldResolve.call(this, name, parent, ...args);
};
Module._load = function(name, parent, ...args) {
  if (name === '@/auth') return { auth: async () => ({ user: { id: 'fixture-admin', role: 'admin', adminRole: role } }) };
  if (name === '@/lib/db') return { db: fixtureDb };
  if (name === '@/lib/email') return { sendLowStockAlert: async () => { throw new Error('Email is forbidden in this fixture'); } };
  return oldLoad.call(this, name, parent, ...args);
};
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
async function main() {
  const { NextRequest } = require('next/server');
  const { PUT } = require('../src/app/api/admin/inventory/route.ts');
  const request = data => new NextRequest('https://example.test/api/admin/inventory', { method: 'PUT', body: JSON.stringify(data) });
  const data = { productId: 'fixture-product', availableBoxes: 20, expectedAvailableBoxes: 20, note: 'Fixture count' };
  assert.equal((await PUT(request(data))).status, 409);
  assert.equal(writes, 0, 'A stale browser count must not mutate inventory or history');
  assert.equal((await PUT(request({ ...data, note: '' }))).status, 400);
  assert.equal(writes, 0);
  role = 'viewer';
  assert.equal((await PUT(request({ ...data, expectedAvailableBoxes: 19 }))).status, 403);
  assert.equal(writes, 0);
  role = 'editor';
  assert.equal((await PUT(request({ ...data, expectedAvailableBoxes: 19 }))).status, 200);
  assert.equal(writes, 3, 'Valid update saves inventory, receipt and movement');
  console.log('inventory API stale-screen, required reason and viewer guards ok');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  Module._load = oldLoad; Module._resolveFilename = oldResolve;
  if (oldTs) require.extensions['.ts'] = oldTs; else delete require.extensions['.ts'];
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousDatabaseUrl;
});
