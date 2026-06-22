// Runs the catalog integrity test using tsx.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "data", "catalog-integrity.test.ts");

const proc = spawn(process.execPath, ["--import", "tsx", filePath], { stdio: ["ignore", "pipe", "pipe"] });
let stdout = "";
let stderr = "";
proc.stdout.on("data", (data) => { stdout += data.toString(); });
proc.stderr.on("data", (data) => { stderr += data.toString(); });

proc.on("close", (code) => {
  if (code === 0) {
    const lastLine = stdout.trim().split("\n").pop();
    console.log(`✓ catalog-integrity.test.ts: ${lastLine}`);
    console.log(JSON.stringify({ ok: true, passed: 1, failed: 0 }, null, 2));
    process.exit(0);
  }
  console.error("✗ catalog-integrity.test.ts");
  if (stdout) console.error(stdout);
  if (stderr) console.error(stderr);
  console.log(JSON.stringify({ ok: false, passed: 0, failed: 1 }, null, 2));
  process.exit(1);
});
