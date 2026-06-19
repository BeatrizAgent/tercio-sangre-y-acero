#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const itemsPath = path.join(root, "data", "items.json");
const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
const ids = new Set(items.map((i) => i.id));

const initialItemIds = ["common_pike_001", "armadura_003", "objeto_002", "objeto_004"];

let failures = 0;

console.log("[check] Items with invalid footprint:");
for (const item of items) {
  const fp = item.footprint;
  const valid =
    fp &&
    Number.isInteger(fp.cols) &&
    Number.isInteger(fp.rows) &&
    fp.cols > 0 &&
    fp.rows > 0;
  if (!valid) {
    console.log(" -", item.id, JSON.stringify(fp));
    failures++;
  }
}

console.log("[check] Initial inventory items present in data/items.json:");
for (const id of initialItemIds) {
  if (!ids.has(id)) {
    console.log(" - MISSING:", id);
    failures++;
  } else {
    console.log(" - ok:", id);
  }
}

if (failures > 0) {
  console.error(`[check] FAILED with ${failures} issue(s)`);
  process.exit(1);
}

console.log("[check] OK - all footprints valid and initial items present");
