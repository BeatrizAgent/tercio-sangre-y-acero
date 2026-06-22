#!/usr/bin/env node
// generate-catalog.mjs — main entry: assembles all data and writes data/catalog.json.

import { validateCatalog, writeJson, ValidationError } from "./core.mjs";
import { buildAssets } from "./assets.mjs";
import { buildItems } from "./items.mjs";
import { buildEnemies } from "./enemies.mjs";
import { buildRanks } from "./ranks.mjs";
import { buildMissions } from "./missions.mjs";
import { buildWounds } from "./wounds.mjs";
import { buildEvents } from "./events.mjs";
import { buildTraining } from "./training.mjs";
import { buildCharacters } from "./characters.mjs";
import { buildLootTables } from "./lootTables.mjs";
import { buildReportFragments } from "./reportFragments.mjs";

function main() {
  const assets = buildAssets();
  const items = buildItems();
  const enemies = buildEnemies();
  const ranks = buildRanks();
  const lootTables = buildLootTables();
  const missions = buildMissions(enemies.map((e) => e.id), lootTables.map((l) => l.id));
  const wounds = buildWounds();
  const events = buildEvents();
  const training = buildTraining();
  const characters = buildCharacters();
  const reportFragments = buildReportFragments();

  const catalog = {
    assets,
    items,
    enemies,
    ranks,
    missions,
    wounds,
    events,
    training,
    characters,
    lootTables,
    reportFragments,
  };

  try {
    validateCatalog(catalog);
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error("Catalog validation failed:");
      for (const f of err.failures) console.error("  -", f);
      process.exit(1);
    }
    throw err;
  }

  const out = writeJson("catalog.json", catalog);
  console.log(`Wrote ${out}`);
  console.log(`Counts:`);
  for (const [k, v] of Object.entries(catalog)) {
    console.log(`  ${k}: ${v.length}`);
  }
}

main();
