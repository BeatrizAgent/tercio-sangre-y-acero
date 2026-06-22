// Runs all domain tests under tests/domain/*.test.ts using tsx.

import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runFile(filePath) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, ["--import", "tsx", filePath], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    proc.on("close", (code) => {
      resolve({ filePath, code, stdout, stderr });
    });
  });
}

async function main() {
  const dir = join(__dirname, "domain");
  const files = (await readdir(dir))
    .filter((name) => name.endsWith(".test.ts"))
    .sort()
    .map((name) => join(dir, name));

  const results = [];
  for (const file of files) {
    results.push(await runFile(file));
  }

  const failed = results.filter((r) => r.code !== 0);
  const passed = results.filter((r) => r.code === 0);

  for (const r of passed) {
    const lastLine = r.stdout.trim().split("\n").pop();
    console.log(`✓ ${r.filePath.split("/").pop()}: ${lastLine}`);
  }

  for (const r of failed) {
    console.error(`✗ ${r.filePath.split("/").pop()}`);
    if (r.stdout) console.error(r.stdout);
    if (r.stderr) console.error(r.stderr);
  }

  console.log(JSON.stringify({ ok: failed.length === 0, passed: passed.length, failed: failed.length }, null, 2));
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
