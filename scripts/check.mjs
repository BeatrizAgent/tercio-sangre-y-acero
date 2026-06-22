#!/usr/bin/env node
// check.mjs — sanity checks for the unified catalog.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const catalogPath = path.join(root, "data", "catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const itemIds = new Set(catalog.items.map((i) => i.id));

// The starting inventory for the bisoño (Diego de Arce).
const initialItemIds = [
  "weapon_pica_gastada_001",
  "chest_cuirass_001",
  "consumable_pan_duro_001",
  "consumable_vendas_001",
];

let failures = 0;

console.log("[check] Items with invalid footprint:");
for (const item of catalog.items) {
  const fp = item.footprint;
  const valid =
    fp &&
    Number.isInteger(fp.w) &&
    Number.isInteger(fp.h) &&
    fp.w > 0 &&
    fp.h > 0;
  if (!valid) {
    console.log(" -", item.id, JSON.stringify(fp));
    failures++;
  }
}

console.log("[check] Starting inventory items present in catalog:");
for (const id of initialItemIds) {
  if (!itemIds.has(id)) {
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

console.log("[check] OK - all footprints valid and starting items present");
