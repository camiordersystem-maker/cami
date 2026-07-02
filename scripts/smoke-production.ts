const baseUrl = process.env.PRODUCTION_URL;

if (!baseUrl) {
  throw new Error("PRODUCTION_URL is required for production smoke checks.");
}

const checks = ["/login", "/register"];

for (const path of checks) {
  const url = new URL(path, baseUrl).toString();
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Smoke check failed: ${url} returned ${res.status}`);
  }
  console.log(`ok ${url}`);
}

console.log("production smoke ok");

export {};
