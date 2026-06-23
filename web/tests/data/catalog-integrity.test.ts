import fs from "node:fs";
import path from "node:path";
import { itemDefinitions, getItem } from "../../src/lib/data/items";
import { getItemImagePath } from "../../src/lib/data/items";
import { shopInventory, churchInventory } from "../../src/lib/data/shop";
import { missionDefinitions } from "../../src/lib/data/missions";
import { enemyDefinitions } from "../../src/lib/data/enemies";
import { lootTableDefinitions } from "../../src/lib/data/missions";
import { reportFragmentDefinitions } from "../../src/lib/data/report-fragments";
import { trainingOptions } from "../../src/lib/data/training";
import { rankDefinitions } from "../../src/lib/data/ranks";
import { assetDefinitions, getAssetPublicPath } from "../../src/lib/data/assets";
import { recruitmentCandidates } from "../../src/lib/data/recruitment";

const failures: string[] = [];
const publicDir = path.resolve("public");

function publicFileExists(publicPath: string | undefined) {
  if (!publicPath) return false;
  return fs.existsSync(path.join(publicDir, publicPath.replace(/^\//, "")));
}

// Every shop item exists in catalog.
for (const row of [...shopInventory, ...churchInventory]) {
  if (!getItem(row.itemId)) {
    failures.push(`shop item ${row.itemId} missing in catalog`);
  }
}

// Every mission points to a known enemy and loot table.
const enemyIds = new Set(enemyDefinitions.map((e) => e.id));
const lootIds = new Set(lootTableDefinitions.map((lt) => lt.id));
for (const mission of missionDefinitions) {
  if (!enemyIds.has(mission.enemyId)) {
    failures.push(`mission ${mission.id} enemy ${mission.enemyId} missing`);
  }
  if (mission.lootTableId && !lootIds.has(mission.lootTableId)) {
    failures.push(`mission ${mission.id} loot table ${mission.lootTableId} missing`);
  }

}

// Every loot table entry points to a known item.
for (const table of lootTableDefinitions) {
  for (const drop of table.drops) {
    if (!getItem(drop.itemId)) {
      failures.push(`loot table ${table.id} drop ${drop.itemId} missing`);
    }
  }
}

// Every training option points to a valid stat.
const validStats = new Set(["pike", "sword", "arquebus", "discipline", "vigor", "cunning", "command"]);
for (const option of trainingOptions) {
  if (!validStats.has(option.stat)) {
    failures.push(`training ${option.id} invalid stat ${option.stat}`);
  }
}

// Report generator needs opening, victory and defeat fragments.
const hasAnyOpening = reportFragmentDefinitions.some((f) => f.type === "opening");
const hasAnyVictory = reportFragmentDefinitions.some((f) => f.type === "victory");
const hasAnyDefeat = reportFragmentDefinitions.some((f) => f.type === "defeat");
if (!hasAnyOpening) failures.push("report fragments missing 'opening' type");
if (!hasAnyVictory) failures.push("report fragments missing 'victory' type");
if (!hasAnyDefeat) failures.push("report fragments missing 'defeat' type");

// Every rank references valid thresholds.
for (const rank of rankDefinitions) {
  if (rank.minXp < 0 || rank.minHonor < 0) {
    failures.push(`rank ${rank.id} has negative thresholds`);
  }
}

// Recruitment candidates use known character roles and portraits.
const assetIds = new Set(assetDefinitions.map((a) => a.id));
for (const candidate of recruitmentCandidates) {
  if (!candidate.character.portraitAssetId || !assetIds.has(candidate.character.portraitAssetId)) {
    failures.push(`candidate ${candidate.id} missing portrait asset ${candidate.character.portraitAssetId}`);
  }
}

// All item definitions with assetId link to existing assets.
for (const item of itemDefinitions) {
  if (item.assetId && !assetIds.has(item.assetId)) {
    failures.push(`item ${item.id} asset ${item.assetId} missing`);
  }
  const imagePath = getItemImagePath(item.id);
  if (!publicFileExists(imagePath)) {
    failures.push(`item ${item.id} image path missing on disk: ${imagePath}`);
  }
  if (item.id.startsWith("weapon_pica_")) {
    if (!imagePath.includes("/weapons/weapon_pike_")) {
      failures.push(`pike item ${item.id} must use a weapon pike image, got: ${imagePath}`);
    }
    if (imagePath.includes("/missions/combat-sprites/")) {
      failures.push(`pike item ${item.id} uses combat sprite instead of weapon icon: ${imagePath}`);
    }
  }
}

// Every asset public path must resolve under web/public.
for (const asset of assetDefinitions) {
  const publicPath = getAssetPublicPath(asset);
  if (!publicFileExists(publicPath)) {
    failures.push(`asset ${asset.id} public path missing on disk: ${publicPath}`);
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: "catalog-integrity" }, null, 2));
