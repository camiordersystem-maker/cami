import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isPg =
  (process.env.DATABASE_URL ?? "").startsWith("postgresql://") ||
  (process.env.DATABASE_URL ?? "").startsWith("postgres://");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "better-sqlite3": false,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // On Vercel (PostgreSQL), alias @/lib/db/schema → schema-pg so all
    // server components automatically use PG table definitions.
    // This ensures correct mapToDriverValue for timestamps, booleans, etc.
    if (isPg) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@/lib/db/schema": path.join(__dirname, "src/lib/db/schema-pg"),
      };
    }

    return config;
  },
};

export default nextConfig;
