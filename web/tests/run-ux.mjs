// Runs the UX test battery under tests/ux/ using Vitest directly via node.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const vitestEntry = join(root, "node_modules", "vitest", "vitest.mjs");

if (!existsSync(vitestEntry)) {
  console.error(`Vitest not found at ${vitestEntry}. Did you run pnpm install?`);
  process.exit(1);
}

const proc = spawn(process.execPath, [vitestEntry, "run", "--reporter=default"], {
  stdio: ["ignore", "pipe", "pipe"],
  cwd: root,
});

let stdout = "";
let stderr = "";
proc.stdout.on("data", (data) => { stdout += data.toString(); });
proc.stderr.on("data", (data) => { stderr += data.toString(); });

proc.on("close", (code) => {
  process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  if (code === 0) {
    console.log(`\n${JSON.stringify({ ok: true, passed: 1, failed: 0 }, null, 2)}`);
    process.exit(0);
  }
  console.log(`\n${JSON.stringify({ ok: false, passed: 0, failed: 1 }, null, 2)}`);
  process.exit(1);
});
