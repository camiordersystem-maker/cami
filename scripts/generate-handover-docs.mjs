import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const generated = join(root, "docs", "generated");
mkdirSync(generated, { recursive: true });

function walk(dir, fileName) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, fileName));
    else if (entry === fileName) out.push(full);
  }
  return out.sort();
}

function routeFromFile(file) {
  const rel = relative(join(root, "src", "app"), file).split(sep);
  rel.pop();
  return "/" + rel.filter((part) => !(part.startsWith("(") && part.endsWith(")"))).join("/");
}

function oneLine(value) {
  return value.replace(/\s+/g, " ").trim();
}

function generateRoutes() {
  const rows = walk(join(root, "src", "app"), "page.tsx").map((file) => {
    const source = readFileSync(file, "utf8");
    const h1 = source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
    const clean = oneLine(h1.replace(/<[^>]+>/g, ""));
    return [routeFromFile(file), relative(root, file), clean.includes("{") ? "(dynamic)" : clean || "—"];
  });
  const text = [
    "# Generated Route Inventory",
    "",
    "> Auto-generated from `src/app/**/page.tsx`. Do not edit manually.",
    "",
    "| Route | Source | H1/title hint |",
    "|---|---|---|",
    ...rows.map(([route, file, h1]) => `| \`${route}\` | \`${file}\` | ${h1} |`),
    "",
  ].join("\n");
  writeFileSync(join(generated, "ROUTES.md"), text);
}

function generateApis() {
  const rows = walk(join(root, "src", "app", "api"), "route.ts").map((file) => {
    const source = readFileSync(file, "utf8");
    let methods = [...source.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)].map((m) => m[1]);
    if (file.includes("[...nextauth]")) methods = ["GET", "POST"];
    let access = "public/special";
    if (source.includes("requireSuperAdmin")) access = "superadmin";
    else if (source.includes("requireEditor")) access = "admin editor+ (inspect GET separately)";
    else if (source.includes('role !== "admin"')) access = "admin";
    else if (source.includes('role !== "member"')) access = "member";
    else if (source.includes("await auth()")) access = "authenticated";
    const note = source.includes("verifyLineSignature") ? "LINE signature" : "—";
    return [routeFromFile(file), methods.join(",") || "Auth.js handlers", access, note];
  });
  const text = [
    "# Generated API Inventory",
    "",
    "> Auto-generated from `src/app/api/**/route.ts`. Authorization is summarized from source markers; route source remains authoritative.",
    "",
    "| API | Methods | Access summary | Notes |",
    "|---|---|---|---|",
    ...rows.map(([route, methods, access, note]) => `| \`${route}\` | \`${methods}\` | ${access} | ${note} |`),
    "",
  ].join("\n");
  writeFileSync(join(generated, "API_INVENTORY.md"), text);
}

function findMatchingBrace(source, start) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error("Unbalanced schema braces");
}

function splitTopLevelFields(body) {
  const chunks = [];
  let start = 0;
  let p = 0, b = 0, c = 0;
  let quote = "";
  let escaped = false;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "(") p += 1;
    else if (ch === ")") p -= 1;
    else if (ch === "[") b += 1;
    else if (ch === "]") b -= 1;
    else if (ch === "{") c += 1;
    else if (ch === "}") c -= 1;
    else if (ch === "," && p === 0 && b === 0 && c === 0) {
      chunks.push(body.slice(start, i).trim());
      start = i + 1;
    }
  }
  chunks.push(body.slice(start).trim());
  return chunks.filter(Boolean);
}

function generateDatabase() {
  const file = join(root, "src", "lib", "db", "schema-pg.ts");
  const source = readFileSync(file, "utf8");
  const lines = [
    "# Generated PostgreSQL Schema Inventory",
    "",
    "> Auto-generated from `src/lib/db/schema-pg.ts`. Raw Drizzle expressions are preserved for review.",
    "",
    "## Enums",
    "",
  ];

  for (const match of source.matchAll(/export const (\w+)\s*=\s*pgEnum\("([^"]+)",\s*\[([\s\S]*?)\]\);/g)) {
    const values = [...match[3].matchAll(/"([^"]+)"/g)].map((m) => `\`${m[1]}\``);
    lines.push(`- \`${match[2]}\` (\`${match[1]}\`): ${values.join(", ")}`);
  }

  lines.push("", "## Tables", "");
  const tablePattern = /export const (\w+)\s*=\s*pgTable\(\s*"([^"]+)"\s*,\s*\{/g;
  for (const match of source.matchAll(tablePattern)) {
    const open = match.index + match[0].lastIndexOf("{");
    const close = findMatchingBrace(source, open);
    const body = source.slice(open + 1, close);
    lines.push(`### \`${match[2]}\``, "", `Source export: \`${match[1]}\``, "", "| Property | DB column | Drizzle definition |", "|---|---|---|");
    for (const chunk of splitTopLevelFields(body)) {
      const field = chunk.match(/^(\w+)\s*:\s*([\s\S]*)$/);
      if (!field) continue;
      const expression = oneLine(field[2]).replace(/\|/g, "\\|");
      const dbColumn = expression.match(/\("([^"]+)"/)?.[1] ?? "—";
      const shortened = expression.length > 240 ? expression.slice(0, 237) + "..." : expression;
      lines.push(`| \`${field[1]}\` | \`${dbColumn}\` | \`${shortened}\` |`);
    }
    lines.push("");
  }
  writeFileSync(join(generated, "DATABASE_SCHEMA.md"), lines.join("\n") + "\n");
}

function generateMigrations() {
  const dir = join(root, "src", "lib", "db", "migrations", "pg");
  const files = readdirSync(dir).filter((name) => name.endsWith(".sql")).sort();
  const lines = [
    "# Generated Migration Inventory",
    "",
    "> Auto-generated from PostgreSQL migration SQL. SHA-256 is for change detection only.",
    "",
    "| Order | File | SHA-256 | Bytes |",
    "|---:|---|---|---:|",
  ];
  files.forEach((name, index) => {
    const content = readFileSync(join(dir, name));
    lines.push(`| ${index} | \`${name}\` | \`${createHash("sha256").update(content).digest("hex")}\` | ${content.length} |`);
  });
  lines.push("");
  writeFileSync(join(generated, "MIGRATIONS.md"), lines.join("\n"));
}

generateRoutes();
generateApis();
generateDatabase();
generateMigrations();
console.log("generated handover docs");
