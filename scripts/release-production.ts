import { spawnSync } from "node:child_process";

if (process.env.CONFIRM_PRODUCTION_RELEASE !== "true") {
  throw new Error(
    "Production release is locked. Set CONFIRM_PRODUCTION_RELEASE=true only after following docs/PRODUCTION_RELEASE.md."
  );
}

const steps = [
  ["npm", ["run", "preflight"]],
  ["npm", ["run", "smoke:production"]],
];

for (const [command, args] of steps) {
  console.log(`\n> ${command} ${(args as string[]).join(" ")}`);
  const result = spawnSync(command as string, args as string[], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("release gate passed; deploy/push remains manual until this script is extended with approved production credentials.");
