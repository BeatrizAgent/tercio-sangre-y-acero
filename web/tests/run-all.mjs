// Runs the full frontend test battery: domain, store, and data integrity.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const runners = ["run-domain.mjs", "run-store.mjs", "run-data.mjs", "run-api.mjs", "run-ux.mjs"];

async function runRunner(name) {
  return new Promise((resolve) => {
    const proc = spawn("node", [join(__dirname, name)], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    proc.on("close", (code) => {
      resolve({ name, code, stdout, stderr });
    });
  });
}

async function main() {
  const results = [];
  for (const runner of runners) {
    results.push(await runRunner(runner));
  }

  const failed = results.filter((r) => r.code !== 0);
  const passed = results.filter((r) => r.code === 0);

  for (const r of passed) {
    console.log(`\n--- ${r.name} ---`);
    console.log(r.stdout.trim());
  }

  for (const r of failed) {
    console.error(`\n--- ${r.name} FAILED ---`);
    console.error(r.stdout);
    console.error(r.stderr);
  }

  const summary = {
    ok: failed.length === 0,
    passed: passed.length,
    failed: failed.length,
    runners: results.map((r) => ({ name: r.name, ok: r.code === 0 })),
  };

  console.log("\n" + JSON.stringify(summary, null, 2));
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
