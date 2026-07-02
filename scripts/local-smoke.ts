const base = process.env.LOCAL_APP_URL ?? "http://localhost:3000";

async function main() {
  for (const pathname of ["/api/health", "/login", "/register"]) {
    const res = await fetch(new URL(pathname, base));
    if (!res.ok) throw new Error(`${pathname} returned ${res.status}`);
    console.log(`ok ${pathname}`);
  }
  console.log("local smoke completed");
}

main().catch((error) => {
  console.error("local smoke failed:", error);
  process.exitCode = 1;
});

export {};
