#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
}

function indexById(name, rows) {
  const ids = new Set();
  const duplicates = [];
  for (const row of rows) {
    if (!row.id) duplicates.push(`${name}: missing id`);
    else if (ids.has(row.id)) duplicates.push(`${name}: duplicate ${row.id}`);
    else ids.add(row.id);
  }
  return { ids, duplicates };
}

const assets = readJson("assets.json");
const items = readJson("items.json");
const missions = readJson("missions.json");
const enemies = readJson("enemies.json");
const lootTables = readJson("loot_tables.json");
const wounds = readJson("wounds.json");
const characters = readJson("characters.json");
const events = readJson("events.json");

const failures = [];
const assetIndex = indexById("assets", assets);
const itemIndex = indexById("items", items);
const missionIndex = indexById("missions", missions);
const enemyIndex = indexById("enemies", enemies);
const lootIndex = indexById("loot_tables", lootTables);
const woundIndex = indexById("wounds", wounds);
const characterIndex = indexById("characters", characters);
const eventIndex = indexById("events", events);

failures.push(
  ...assetIndex.duplicates,
  ...itemIndex.duplicates,
  ...missionIndex.duplicates,
  ...enemyIndex.duplicates,
  ...lootIndex.duplicates,
  ...woundIndex.duplicates,
  ...characterIndex.duplicates,
  ...eventIndex.duplicates,
);

function requireAsset(id, owner) {
  if (id && !assetIndex.ids.has(id)) failures.push(`${owner}: missing asset ${id}`);
}

function requireItem(id, owner) {
  if (id && !itemIndex.ids.has(id)) failures.push(`${owner}: missing item ${id}`);
}

for (const asset of assets) {
  if (!Array.isArray(asset.dimensions) || asset.dimensions.length !== 2) {
    failures.push(`assets:${asset.id}: invalid dimensions`);
  }
  if (asset.mature === true && !["blurred", "obscured"].includes(asset.presentation)) {
    failures.push(`assets:${asset.id}: mature asset must be blurred or obscured`);
  }
}

for (const item of items) {
  requireAsset(item.assetId, `items:${item.id}`);
  if (!item.footprint || item.footprint.cols < 1 || item.footprint.rows < 1) {
    failures.push(`items:${item.id}: invalid footprint`);
  }
}

for (const table of lootTables) {
  for (const drop of table.drops ?? []) requireItem(drop.id, `loot_tables:${table.id}`);
}

for (const mission of missions) {
  if (!enemyIndex.ids.has(mission.enemy_id)) failures.push(`missions:${mission.id}: missing enemy ${mission.enemy_id}`);
  requireAsset(mission.sceneAssetId, `missions:${mission.id}`);
  if (mission.loot_table && !lootIndex.ids.has(mission.loot_table)) {
    failures.push(`missions:${mission.id}: missing loot table ${mission.loot_table}`);
  }
  if (mission.wound_id && !woundIndex.ids.has(mission.wound_id)) {
    failures.push(`missions:${mission.id}: missing wound ${mission.wound_id}`);
  }
}

for (const enemy of enemies) requireAsset(enemy.portraitAssetId, `enemies:${enemy.id}`);

for (const character of characters) {
  requireAsset(character.portraitAssetId, `characters:${character.id}`);
  requireAsset(character.tercioAssetId, `characters:${character.id}`);
  requireAsset(character.emotionAssetId, `characters:${character.id}`);
  for (const itemId of Object.values(character.equipment ?? {})) requireItem(itemId, `characters:${character.id}`);
}

for (const event of events) {
  requireAsset(event.assetId, `events:${event.id}`);
  for (const choice of event.choices ?? []) {
    for (const item of choice.requirements?.items ?? []) requireItem(item.itemId, `events:${event.id}`);
    for (const item of choice.effects?.items ?? []) requireItem(item.itemId, `events:${event.id}`);
    if (choice.effects?.wound && !woundIndex.ids.has(choice.effects.wound)) {
      failures.push(`events:${event.id}: missing wound ${choice.effects.wound}`);
    }
  }
}

for (const id of [
  "common_pike_001",
  "armor_cuirass_common_003",
  "prop_pan_de_municion_004",
  "prop_vendas_de_lino_002",
]) {
  requireItem(id, "initial_state");
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: {
  assets: assets.length,
  items: items.length,
  missions: missions.length,
  enemies: enemies.length,
  lootTables: lootTables.length,
  wounds: wounds.length,
  characters: characters.length,
  events: events.length,
} }, null, 2));
