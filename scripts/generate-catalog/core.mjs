#!/usr/bin/env node
// core.mjs — shared utilities and validation for catalog generation.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const genDir = path.resolve(__dirname);
const root = path.resolve(genDir, "..", "..");
const dataDir = path.join(root, "data");

export { __dirname, genDir, root, dataDir };

// -----------------------------------------------------------------------------
// FILE IO
// -----------------------------------------------------------------------------

export function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
}

export function writeJson(name, value) {
  const out = path.join(dataDir, name);
  fs.writeFileSync(out, JSON.stringify(value, null, 2) + "\n", "utf8");
  return out;
}

// -----------------------------------------------------------------------------
// SHARED CONSTANTS
// -----------------------------------------------------------------------------

export const W = 1024;
export const H = 1024;

export const PROMPT_BG =
  ", transparent background, gritty historical oil-painting style, period-accurate 16th-17th century early modern Spanish tercios, mud, steel, powder smoke, no modern elements, no fantasy glow, no neon, no anime";

export const RARITY_FROM_TIER = {
  1: "common",
  2: "uncommon",
  3: "rare",
  4: "veteran",
  5: "masterwork",
};

export const SLOT_TYPES = new Set([
  "weapon",
  "offhand",
  "helmet",
  "chest",
  "legs",
  "boots",
  "gloves",
  "trinket",
  "consumable",
  "material",
]);

export const TYPE_KINDS = new Set([
  "sword",
  "pike",
  "arquebus",
  "armor",
  "tool",
  "food",
  "medicine",
  "religious",
  "coin",
  "misc",
]);

export const REGIONS = new Set([
  "castilla",
  "flandes",
  "italia",
  "campamento",
  "camino",
  "asedio",
]);

export const LOCATION_TYPES = new Set([
  "road",
  "camp",
  "siege",
  "village",
  "ford",
  "trench",
  "outpost",
  "tavern",
  "skirmish",
]);

export const REPORT_TYPES = new Set([
  "opening",
  "attack",
  "hit",
  "miss",
  "wound",
  "loot",
  "victory",
  "defeat",
]);

export const PRESENTATIONS = new Set(["normal", "blurred", "silhouette"]);

export const WOUND_SEVERITIES = new Set(["minor", "moderate", "serious", "grave"]);

export const CHARACTER_ROLES = new Set([
  "soldier",
  "surgeon",
  "quartermaster",
  "chaplain",
  "captain",
  "recruit",
]);

// -----------------------------------------------------------------------------
// ASSET FACTORY
// -----------------------------------------------------------------------------

export function makeAsset(id, kind, usage, prompt, opts = {}) {
  return {
    id,
    kind,
    publicPath: `/assets/gpt-bank/${id}.png`,
    width: W,
    height: H,
    usage,
    mature: !!opts.mature,
    presentation: opts.presentation ?? (opts.mature ? "blurred" : "normal"),
    prompt: `Historical SFW game asset${PROMPT_BG}. ${prompt}.`,
  };
}

// -----------------------------------------------------------------------------
// ITEM FACTORY
// -----------------------------------------------------------------------------

export function emptyStats() {
  return {
    pike: 0,
    sword: 0,
    arquebus: 0,
    discipline: 0,
    vigor: 0,
    cunning: 0,
    command: 0,
    armor: 0,
    damageMin: 0,
    damageMax: 0,
  };
}

export function tierPrice(tier, baseMul = 1) {
  const bases = { 1: 12, 2: 65, 3: 220, 4: 520 };
  return Math.round((bases[tier] ?? 12) * baseMul);
}

export function sellFor(price) {
  return Math.max(1, Math.floor(price * 0.35));
}

export function newItem(p) {
  return {
    id: p.id,
    name: p.name,
    slot: p.slot,
    type: p.type,
    description: p.description,
    rarity: p.rarity ?? RARITY_FROM_TIER[p.tier] ?? "common",
    tier: p.tier,
    price: p.price,
    sellPrice: sellFor(p.price),
    assetId: p.assetId,
    footprint: p.footprint,
    stats: p.stats,
    requirements: p.requirements ?? { level: p.tier, rankId: "bisono" },
    passives: p.passives ?? [],
    tags: p.tags ?? [],
  };
}

// -----------------------------------------------------------------------------
// VALIDATION
// -----------------------------------------------------------------------------

export class ValidationError extends Error {
  constructor(failures) {
    super(`Validation failed with ${failures.length} issue(s)`);
    this.failures = failures;
  }
}

export function validateCatalog(catalog) {
  const failures = [];
  const idsByKind = {};

  // 1. ID uniqueness per kind
  for (const kind of Object.keys(catalog)) {
    const arr = catalog[kind] ?? [];
    idsByKind[kind] = new Set();
    for (const obj of arr) {
      if (!obj.id) {
        failures.push(`${kind}: missing id`);
        continue;
      }
      if (idsByKind[kind].has(obj.id)) {
        failures.push(`${kind}: duplicate id ${obj.id}`);
        continue;
      }
      idsByKind[kind].add(obj.id);
    }
  }

  // 2. Asset reference checks
  const assetIds = idsByKind.assets ?? new Set();

  // 3. Item references
  const itemIds = idsByKind.items ?? new Set();
  for (const item of catalog.items ?? []) {
    if (item.assetId && !assetIds.has(item.assetId)) {
      failures.push(`items:${item.id}: missing asset ${item.assetId}`);
    }
    if (!SLOT_TYPES.has(item.slot)) {
      failures.push(`items:${item.id}: invalid slot ${item.slot}`);
    }
    if (!TYPE_KINDS.has(item.type)) {
      failures.push(`items:${item.id}: invalid type ${item.type}`);
    }
    if (item.mature === true && !PRESENTATIONS.has(item.presentation)) {
      failures.push(`items:${item.id}: mature requires presentation`);
    }
  }

  // 4. Enemy references
  const enemyIds = idsByKind.enemies ?? new Set();
  for (const enemy of catalog.enemies ?? []) {
    if (enemy.assetId && !assetIds.has(enemy.assetId)) {
      failures.push(`enemies:${enemy.id}: missing asset ${enemy.assetId}`);
    }
    if (enemy.region && !REGIONS.has(enemy.region)) {
      failures.push(`enemies:${enemy.id}: invalid region ${enemy.region}`);
    }
  }

  // 5. Mission references
  const rankIds = idsByKind.ranks ?? new Set();
  const lootIds = idsByKind.lootTables ?? new Set();
  for (const mission of catalog.missions ?? []) {
    for (const eid of mission.enemyPool ?? []) {
      if (!enemyIds.has(eid)) {
        failures.push(`missions:${mission.id}: missing enemy ${eid}`);
      }
    }
    if (mission.lootTableId && !lootIds.has(mission.lootTableId)) {
      failures.push(`missions:${mission.id}: missing loot table ${mission.lootTableId}`);
    }
    if (mission.requiredRankId && !rankIds.has(mission.requiredRankId)) {
      failures.push(`missions:${mission.id}: missing required rank ${mission.requiredRankId}`);
    }
    if (mission.sceneAssetId && !assetIds.has(mission.sceneAssetId)) {
      failures.push(`missions:${mission.id}: missing scene asset ${mission.sceneAssetId}`);
    }
    if (mission.region && !REGIONS.has(mission.region)) {
      failures.push(`missions:${mission.id}: invalid region ${mission.region}`);
    }
    if (mission.locationType && !LOCATION_TYPES.has(mission.locationType)) {
      failures.push(`missions:${mission.id}: invalid locationType ${mission.locationType}`);
    }
  }

  // 6. Character references
  for (const char of catalog.characters ?? []) {
    if (char.portraitAssetId && !assetIds.has(char.portraitAssetId)) {
      failures.push(`characters:${char.id}: missing portrait asset ${char.portraitAssetId}`);
    }
    if (char.rankId && !rankIds.has(char.rankId)) {
      failures.push(`characters:${char.id}: missing rank ${char.rankId}`);
    }
    if (char.role && !CHARACTER_ROLES.has(char.role)) {
      failures.push(`characters:${char.id}: invalid role ${char.role}`);
    }
    for (const iid of char.startingItems ?? []) {
      if (!itemIds.has(iid)) {
        failures.push(`characters:${char.id}: missing item ${iid}`);
      }
    }
  }

  // 7. Wound checks
  for (const wound of catalog.wounds ?? []) {
    if (wound.severity && !WOUND_SEVERITIES.has(wound.severity)) {
      failures.push(`wounds:${wound.id}: invalid severity ${wound.severity}`);
    }
    for (const tid of wound.treatmentItems ?? []) {
      if (!itemIds.has(tid)) {
        failures.push(`wounds:${wound.id}: missing treatment item ${tid}`);
      }
    }
  }

  // 8. Loot table references
  for (const table of catalog.lootTables ?? []) {
    for (const entry of table.entries ?? []) {
      if (!itemIds.has(entry.itemId)) {
        failures.push(`lootTables:${table.id}: missing item ${entry.itemId}`);
      }
    }
  }

  // 9. Report fragments
  for (const frag of catalog.reportFragments ?? []) {
    if (frag.type && !REPORT_TYPES.has(frag.type)) {
      failures.push(`reportFragments:${frag.id}: invalid type ${frag.type}`);
    }
  }

  // 10. Events
  for (const event of catalog.events ?? []) {
    if (event.mature === true && !PRESENTATIONS.has(event.presentation)) {
      failures.push(`events:${event.id}: mature requires valid presentation`);
    }
    for (const choice of event.choices ?? []) {
      for (const itm of choice.effects?.items ?? []) {
        if (!itemIds.has(itm.itemId)) {
          failures.push(`events:${event.id}: choice ${choice.id} missing item ${itm.itemId}`);
        }
      }
      const woundIds = idsByKind.wounds ?? new Set();
      if (choice.effects?.wound && !woundIds.has(choice.effects.wound)) {
        failures.push(`events:${event.id}: choice ${choice.id} missing wound ${choice.effects.wound}`);
      }
    }
  }

  // 11. Training
  for (const tr of catalog.training ?? []) {
    if (tr.requiredRankId && !rankIds.has(tr.requiredRankId)) {
      failures.push(`training:${tr.id}: missing rank ${tr.requiredRankId}`);
    }
  }

  // 12. Counts (minimum)
  const minCounts = {
    assets: 80,
    items: 120,
    enemies: 24,
    ranks: 12,
    missions: 36,
    wounds: 20,
    events: 30,
    training: 7,
    characters: 20,
    lootTables: 18,
    reportFragments: 80,
  };
  for (const [kind, min] of Object.entries(minCounts)) {
    const got = (catalog[kind] ?? []).length;
    if (got < min) {
      failures.push(`counts:${kind}: got ${got}, minimum ${min}`);
    }
  }

  if (failures.length) throw new ValidationError(failures);
}
