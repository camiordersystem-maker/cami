import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isPg =
  (process.env.DATABASE_URL ?? "").startsWith("postgresql://") ||
  (process.env.DATABASE_URL ?? "").startsWith("postgres://");

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
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
