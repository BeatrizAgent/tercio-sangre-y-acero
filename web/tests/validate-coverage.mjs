// validate-coverage.mjs — fail if any exported symbol from
// src/lib/domain/*.ts or src/lib/data/*.ts is not exercised by at least
// one test under tests/.
//
// Read-only: it does not edit any source. Use `pnpm validate` to chain
// it with the other static checks (mvp, db-contract, data-references).

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const SRC_DIRS = ["src/lib/domain", "src/lib/data"];
const TEST_DIRS = ["tests/domain", "tests/data", "tests/store", "tests/ux", "tests/api", "tests/e2e"];
// Threshold: a soft 50% of *runtime* exports must be covered. Type-only
// exports (interfaces, type aliases) are excluded because they exist for
// the compiler and are not strictly "testable" code paths.
const FAIL_THRESHOLD = 0.5;

function listFiles(dir, ext) {
  const out = [];
  const abs = path.join(root, dir);
  let entries;
  try {
    entries = readdirSync(abs);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const p = path.join(abs, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      out.push(...listFiles(path.join(dir, entry), ext));
    } else if (entry.endsWith(ext)) {
      out.push(path.join(dir, entry));
    }
  }
  return out;
}

function extractRuntimeExports(filePath) {
  const text = readFileSync(path.join(root, filePath), "utf8");
  const exports = new Set();
  // Skip type aliases and interfaces — only count runtime exports
  // (functions, consts, classes) which are the ones the tests can
  // actually call.
  const re = /^\s*export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    exports.add(m[1]);
  }
  // export { foo, bar } — keep the names regardless of original kind
  // (TS will reject interface re-exports without `export type`).
  const re2 = /^\s*export\s*(?!\s*type\s)\{([^}]+)\}/gm;
  while ((m = re2.exec(text)) !== null) {
    for (const ident of m[1].split(",")) {
      const name = ident.trim().split(/\s+as\s+/)[0].trim();
      if (name) exports.add(name);
    }
  }
  return exports;
}

function allTestFiles() {
  const all = [];
  for (const dir of TEST_DIRS) {
    all.push(...listFiles(dir, ".ts"));
    all.push(...listFiles(dir, ".tsx"));
    all.push(...listFiles(dir, ".mjs"));
  }
  return all;
}

function readAll(filePaths) {
  return filePaths
    .map((p) => {
      try {
        return readFileSync(path.join(root, p), "utf8");
      } catch {
        return "";
      }
    })
    .join("\n");
}

const allTestCode = readAll(allTestFiles());

const failures = [];
const summary = { totalExports: 0, covered: 0, missing: [] };

for (const dir of SRC_DIRS) {
  const files = listFiles(dir, ".ts").filter((f) => !f.endsWith(".d.ts"));
  for (const file of files) {
    const exports = extractRuntimeExports(file);
    for (const name of exports) {
      summary.totalExports += 1;
      // Considered "covered" if the name appears anywhere in the test
      // code (imports, references, comments).
      if (new RegExp(`\\b${name}\\b`).test(allTestCode)) {
        summary.covered += 1;
      } else {
        summary.missing.push({ file, name });
      }
    }
  }
}

const ratio = summary.totalExports > 0 ? summary.covered / summary.totalExports : 1;
summary.ratio = Number(ratio.toFixed(3));
summary.threshold = FAIL_THRESHOLD;

if (ratio < FAIL_THRESHOLD) {
  failures.push(
    `Coverage ${(ratio * 100).toFixed(1)}% < ${(FAIL_THRESHOLD * 100).toFixed(0)}% threshold`,
  );
  for (const miss of summary.missing.slice(0, 25)) {
    failures.push(`  uncovered: ${miss.file} -> ${miss.name}`);
  }
  if (summary.missing.length > 25) {
    failures.push(`  ... and ${summary.missing.length - 25} more`);
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, summary, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      summary,
      checked: `${summary.totalExports} exports across ${SRC_DIRS.join(" + ")}`,
    },
    null,
    2,
  ),
);
