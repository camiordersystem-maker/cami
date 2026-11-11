import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const required = [
  "docs/README.md",
  "docs/SYSTEM_OVERVIEW.md",
  "docs/ARCHITECTURE.md",
  "docs/FUNCTIONAL_SPEC.md",
  "docs/SCREEN_SPEC.md",
  "docs/BUSINESS_FLOWS.md",
  "docs/ROLES_AND_PERMISSIONS.md",
  "docs/DATA_MODEL.md",
  "docs/API_SPEC.md",
  "docs/INTEGRATIONS.md",
  "docs/SECURITY_AND_NONFUNCTIONAL.md",
  "docs/ENVIRONMENTS_AND_RELEASE.md",
  "docs/DOCUMENTATION_POLICY.md",
  "docs/MANUAL_MAINTENANCE.md",
  "docs/generated/ROUTES.md",
  "docs/generated/API_INVENTORY.md",
  "docs/generated/DATABASE_SCHEMA.md",
  "docs/generated/MIGRATIONS.md",
  "src/lib/manual.ts",
  "src/lib/manual-routes.ts",
  "scripts/manual-capture-targets.json",
  "scripts/capture-manual-screenshots.mjs",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("[FAIL] Missing documentation files:\n" + missing.map((x) => `- ${x}`).join("\n"));
  process.exit(1);
}

const manual = fs.readFileSync(path.join(root, "src/lib/manual.ts"), "utf8");
const captures = JSON.parse(fs.readFileSync(path.join(root, "scripts/manual-capture-targets.json"), "utf8"));
const referenced = [...manual.matchAll(/screenshot:\s*"\/manual\/screenshots\/([^"]+)"/g)].map((m) => m[1]);
const configured = new Set([...captures.member, ...captures.admin].map((x) => x.output));
const uncovered = [...new Set(referenced)].filter((file) => !configured.has(file));
if (uncovered.length) {
  console.error("[FAIL] Manual screenshots without capture target:\n" + uncovered.map((x) => `- ${x}`).join("\n"));
  process.exit(1);
}

const memberSlugs = [...manual.matchAll(/slug:\s*"([^"]+)"[\s\S]{0,80}role:\s*"member"/g)].length;
const adminSlugs = [...manual.matchAll(/slug:\s*"([^"]+)"[\s\S]{0,80}role:\s*"admin"/g)].length;
if (memberSlugs < 5 || adminSlugs < 8) {
  console.error(`[FAIL] Manual article coverage too small: member=${memberSlugs}, admin=${adminSlugs}`);
  process.exit(1);
}

console.log(`documentation check ok (member articles=${memberSlugs}, admin articles=${adminSlugs}, screenshots=${configured.size})`);
