import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const targetConfig = JSON.parse(
  await fs.readFile(path.join(here, "manual-capture-targets.json"), "utf8")
);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("[STOP] Playwright is not installed.");
  console.error("Run: npm install --no-save playwright && npx playwright install chromium");
  process.exit(1);
}

const baseUrl = (process.env.CAMI_MANUAL_BASE_URL || "https://cami-order-system-staging.cami-order-system.workers.dev").replace(/\/$/, "");
const outputDir = path.join(root, "public", "manual", "screenshots");
const isProduction = /cami-order-system-production\./.test(baseUrl);

if (isProduction && process.env.ALLOW_PRODUCTION_MANUAL_CAPTURE !== "true") {
  console.error("[STOP] Production capture is disabled by default. Use STAGING for manuals.");
  process.exit(1);
}

const credentials = {
  member: {
    email: process.env.CAMI_MANUAL_MEMBER_EMAIL,
    password: process.env.CAMI_MANUAL_MEMBER_PASSWORD,
  },
  admin: {
    email: process.env.CAMI_MANUAL_ADMIN_EMAIL,
    password: process.env.CAMI_MANUAL_ADMIN_PASSWORD,
  },
};

for (const role of ["member", "admin"]) {
  if (!credentials[role].email || !credentials[role].password) {
    console.error(`[STOP] Missing CAMI_MANUAL_${role.toUpperCase()}_EMAIL / CAMI_MANUAL_${role.toUpperCase()}_PASSWORD`);
    process.exit(1);
  }
}

await fs.mkdir(path.join(outputDir, "member"), { recursive: true });
await fs.mkdir(path.join(outputDir, "admin"), { recursive: true });

const browser = await chromium.launch({ headless: true });

async function login(role) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    locale: "ja-JP",
  });
  const page = await context.newPage();

  // A cold STAGING login page can become clickable before Next/React hydration
  // has attached the form submit handler. Clicking then performs the browser's
  // native GET submit and exposes form values in the URL query.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto(`${baseUrl}/login`, { waitUntil: "load", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000 * attempt);

    await page.locator('input[name="email"]').fill(credentials[role].email);
    await page.locator('input[name="password"]').fill(credentials[role].password);

    const loginButton = page.getByRole("button", { name: "ログイン", exact: true });
    await loginButton.waitFor({ state: "visible", timeout: 10000 });
    await loginButton.click();

    try {
      await page.waitForURL((url) => url.pathname !== "/login", { timeout: 15000 });
      await page.waitForLoadState("domcontentloaded");
      return { context, page };
    } catch {
      const url = new URL(page.url());
      const nativeGetSubmit =
        url.pathname === "/login" &&
        (url.searchParams.has("email") || url.searchParams.has("password"));

      if (nativeGetSubmit) {
        console.warn(`[WARN] ${role} login hydration race detected; retrying (${attempt}/3)`);
        continue;
      }

      const error = page.getByText(
        "メールアドレスまたはパスワードが正しくありません",
        { exact: true }
      );
      if (await error.count()) {
        await context.close();
        throw new Error(`${role} login failed: staging credential rejected`);
      }

      if (attempt === 3) {
        await context.close();
        throw new Error(
          `${role} login failed after hydration-safe retries; current path=${url.pathname}`
        );
      }
    }
  }

  await context.close();
  throw new Error(`${role} login failed`);
}

async function preparePage(page) {
  // Manual images should not show the STAGING ribbon or logged-in person's name/email.
  const staging = page.getByText("ステージング環境", { exact: true });
  if (await staging.count()) {
    await staging.evaluateAll((nodes) => nodes.forEach((node) => { node.style.display = "none"; }));
  }
  await page.addStyleTag({
    content: `
      [data-manual-mask] { filter: blur(6px) !important; user-select: none !important; }
      *, *::before, *::after { caret-color: transparent !important; }
    `,
  });
}

async function captureRole(role) {
  const { context, page } = await login(role);
  try {
    for (const target of targetConfig[role]) {
      const response = await page.goto(`${baseUrl}${target.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (!response || !response.ok()) {
        throw new Error(`${role} ${target.path}: HTTP ${response?.status() ?? "unknown"}`);
      }
      await page.waitForTimeout(700);
      await preparePage(page);
      const file = path.join(outputDir, target.output);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, fullPage: true });
      console.log(`[OK] ${target.path} -> ${path.relative(root, file)}`);
    }
  } finally {
    await context.close();
  }
}

try {
  await captureRole("member");
  await captureRole("admin");
  console.log("MANUAL_SCREENSHOT_CAPTURE=PASS");
} finally {
  await browser.close();
}
