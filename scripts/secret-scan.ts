import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignore = new Set(["node_modules", ".next", ".git", "local.db", "local.db-shm", "local.db-wal"]);
const filePattern = /\.(ts|tsx|js|json|md|txt|env|yml|yaml)$/;
const tokenPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /re_[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
];
const envAssignment = /^\s*(?:export\s+)?([A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL)[A-Z0-9_]*)\s*=\s*(.+?)\s*$/;
const allowedValues = [
  "",
  "changeme",
  "dummy",
  "dummy-secret",
  "local-secret-change-me",
  "re_dummy_local_dev",
  "Admin1234!",
  "Member1234!",
];

let findings = 0;

function isAllowedValue(value: string) {
  const normalized = value.replace(/^['"]|['"]$/g, "").trim();
  if (allowedValues.includes(normalized)) return true;
  if (normalized.includes("localhost") || normalized.includes("127.0.0.1")) return true;
  if (normalized.startsWith("${") || normalized.includes("process.env")) return true;
  return false;
}

function checkFile(full: string) {
  const text = fs.readFileSync(full, "utf8");
  const relative = path.relative(root, full);

  for (const pattern of tokenPatterns) {
    if (pattern.test(text)) {
      console.error(`possible secret token: ${relative}`);
      findings++;
      return;
    }
  }

  for (const line of text.split("\n")) {
    const match = envAssignment.exec(line);
    if (match && !isAllowedValue(match[2])) {
      console.error(`possible secret env value: ${relative}`);
      findings++;
      return;
    }
  }
}

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (filePattern.test(entry.name)) checkFile(full);
  }
}

walk(root);
if (findings > 0) process.exit(1);
console.log("secret scan ok");
