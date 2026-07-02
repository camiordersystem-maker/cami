import { spawnSync } from "node:child_process";

const commands: Array<[string, string[], Record<string, string>?]> = [
  ["git", ["status", "--short", "--branch"]],
  ["npm", ["run", "lint"]],
  ["npm", ["run", "typecheck"]],
  ["npm", ["test"]],
  ["npm", ["run", "db:verify"]],
  [
    "npm",
    ["run", "build"],
    {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://preflight:preflight@example.invalid/preflight",
      AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "preflight-build-secret",
    },
  ],
];

for (const [command, args, env] of commands) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: env ? { ...process.env, ...env } : process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\npreflight ok");
