#!/usr/bin/env node
// validate_data_references.mjs — runs the catalog validator from the
// generate-catalog package and prints a summary.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");

const catalog = JSON.parse(
  fs.readFileSync(path.join(dataDir, "catalog.json"), "utf8"),
);

const { validateCatalog, ValidationError } = await import(
  "./generate-catalog/core.mjs"
);

try {
  validateCatalog(catalog);
} catch (err) {
  if (err instanceof ValidationError) {
    console.error(JSON.stringify({ ok: false, failures: err.failures }, null, 2));
    process.exit(1);
  }
  throw err;
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: Object.fromEntries(
        Object.entries(catalog).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0]),
      ),
    },
    null,
    2,
  ),
);
