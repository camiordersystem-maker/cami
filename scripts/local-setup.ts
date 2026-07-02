import { spawnSync } from "node:child_process";
import fs from "node:fs";

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  console.log(`> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!fs.existsSync(".env.local") && fs.existsSync(".env.local.example")) {
  fs.copyFileSync(".env.local.example", ".env.local");
  console.log("created .env.local from .env.local.example");
}

run("docker", ["compose", "up", "-d"]);
run("npm", ["run", "local:migrate"]);
run("npm", ["run", "local:seed"]);
run("npm", ["run", "local:verify"]);
console.log("local setup completed");
