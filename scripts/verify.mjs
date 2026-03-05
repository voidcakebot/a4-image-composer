#!/usr/bin/env node
import { spawn } from "node:child_process";

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with code ${code}`));
    });
  });

try {
  console.log("🔎 Running tests...");
  await run("npm", ["run", "test"]);
  console.log("🏗️ Building app...");
  await run("npm", ["run", "build"]);
  console.log("✅ Verify passed: tests + production build are green.");
} catch (error) {
  console.error("❌ Verify failed");
  console.error(error.message);
  process.exit(1);
}
