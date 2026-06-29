// catalog.ts — central data layer that reads from data/catalog.json.
// Single source of truth for the unified schema: assets, items, enemies, ranks,
// missions, wounds, events, training, characters, lootTables, reportFragments.

import catalogJson from "../../../data/json/catalog.json";
import type { ItemDefinition, Rarity, StatId } from "../types";

type CatalogRoot = {
  assets: Array<{
    id: string;
    kind: string;
    publicPath: string;
    width: number;
    height: number;
    usage: string[];
    mature: boolean;
    presentation: string;
    prompt: string;
  }>;
  items: Array<{
    id: string;
    name: string;
    slot: string;
    type: string;
    description: string;
    rarity: string;
    tier: number;
    price: number;
    sellPrice: number;
    assetId: string;
    footprint: { w: number; h: number };
    stats: Record<string, number>;
    requirements: { level: number; rankId: string };
    passives: Array<{ id: string; label: string; description: string }>;
    tags: string[];
  }>;
  enemies: Array<{
    id: string;
    name: string;
    description: string;
    level: number;
    region: string;
    assetId: string;
    stats: Record<string, number>;
    rewards: { xp: number; coinsMin: number; coinsMax: number; honor: number };
    tags: string[];
  }>;
  ranks: Array<{
    id: string;
    name: string;
    order: number;
    requiredXp: number;
    requiredHonor: number;
    pay: number;
    description: string;
    unlocks: string[];
  }>;
  missions: Array<{
    id: string;
    name: string;
    region: string;
    locationType: string;
    description: string;
    sceneAssetId: string;
    x: number;
    y: number;
    requiredRankId: string;
    minLevel: number;
    fatigueCost: number;
    durationMinutes: number;
    enemyPool: string[];
    lootTableId: string;
    rewards: {
      xpMin: number;
      xpMax: number;
      coinsMin: number;
      coinsMax: number;
      honorMin: number;
      honorMax: number;
    };
    risks: { woundChance: number; eventChance: number };
    tags: string[];
  }>;
  wounds: Array<{
    id: string;
    name: string;
    severity: string;
    description: string;
    effects: Record<string, number>;
    healingCost: number;
    healingHours: number;
    treatmentItems: string[];
    mature: boolean;
    presentation: string;
  }>;
  events: Array<{
    id: string;
    name: string;
    description: string;
    choices: Array<{
      id: string;
      label: string;
      effects: Record<string, unknown>;
      result_text?: string;
    }>;
    mature: boolean;
    presentation: string;
    tags: string[];
  }>;
  training: Array<{
    id: string;
    stat: string;
    name: string;
    description: string;
    baseCost: number;
    costScale: number;
    fatigueCost: number;
    requiredRankId: string;
  }>;
  characters: Array<{
    id: string;
    name: string;
    role: string;
    rankId: string;
    portraitAssetId: string;
    bio: string;
    stats: Record<string, number>;
    startingItems: string[];
    tags: string[];
  }>;
  lootTables: Array<{
    id: string;
    entries: Array<{ itemId: string; weight: number; min: number; max: number }>;
  }>;
  reportFragments: Array<{
    id: string;
    type: "opening" | "attack" | "hit" | "miss" | "wound" | "loot" | "victory" | "defeat";
    text: string;
    tags: string[];
  }>;
};

const catalog = catalogJson as unknown as CatalogRoot;

// -----------------------------------------------------------------------------
// ASSETS
// -----------------------------------------------------------------------------

export const assetDefinitions = catalog.assets;
export type CatalogAsset = (typeof catalog.assets)[number];

export function getAsset(assetId: string | undefined) {
  if (!assetId) return undefined;
  return catalog.assets.find((a) => a.id === assetId);
}

export function getAssetPathById(assetId: string | undefined): string | undefined {
  const a = getAsset(assetId);
  return a?.publicPath;
}

export function getAssetPublicPath(asset: { publicPath: string }): string {
  return asset.publicPath;
}

// -----------------------------------------------------------------------------
// ITEMS — bridge to legacy ItemDefinition so existing code keeps working.
// -----------------------------------------------------------------------------

const RARITY_MAP: Record<string, Rarity> = {
  common: "common",
  uncommon: "uncommon",
  rare: "rare",
  veteran: "epic",
  masterwork: "legendary",
};

const SLOT_MAP: Record<string, string> = {
  weapon: "mainHand",
  offhand: "offHand",
  helmet: "head",
  chest: "body",
  legs: "legs",
  boots: "boots",
  gloves: "accessory",
  trinket: "accessory",
  consumable: "consumable",
  material: "consumable",
};

function itemToLegacy(raw: CatalogRoot["items"][number]): ItemDefinition {
  const stats: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.stats)) {
    if (typeof v === "number") stats[k] = v;
  }
  return {
    id: raw.id,
    name: raw.name,
    category: raw.type,
    slot: (SLOT_MAP[raw.slot] ?? raw.slot) as ItemDefinition["slot"],
    footprint: { cols: raw.footprint.w, rows: raw.footprint.h },
    value: raw.price,
    effects: stats as ItemDefinition["effects"],
    description: raw.description,
    rarity: RARITY_MAP[raw.rarity] ?? "common",
    tier: raw.tier,
    passives: raw.passives.map((p) => ({
      id: p.id,
      name: p.label,
      description: p.description,
      trigger: "passive" as const,
      effect: {},
    })),
    requirements: { minRank: raw.requirements.rankId, minHonor: 0 },
    assetId: raw.assetId,
  };
}

export const itemDefinitions: readonly ItemDefinition[] = catalog.items.map(itemToLegacy);
const FALLBACK_ITEM_IMAGE = "/assets/gpt-bank/ui/icons/saquito_monedas_documento.png";

export function getItem(itemId: string | undefined) {
  if (!itemId) return undefined;
  return itemDefinitions.find((i) => i.id === itemId);
}

export function getItemFootprint(item: ItemDefinition | undefined) {
  const fp = item?.footprint;
  if (fp && Number.isInteger(fp.cols) && Number.isInteger(fp.rows) && fp.cols > 0 && fp.rows > 0) {
    return fp;
  }
  return { cols: 1, rows: 1 };
}

export function getItemImagePath(itemId: string): string {
  const item = getItem(itemId);
  if (item?.assetId) {
    const a = getAsset(item.assetId);
    if (a) return a.publicPath;
  }
  return FALLBACK_ITEM_IMAGE;
}

export function getEquipmentBonuses(equipment: Record<string, string | null>) {
  const bonuses: Record<string, number> = {};
  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue;
    const item = getItem(itemId);
    if (!item) continue;
    for (const [key, value] of Object.entries(item.effects)) {
      if (typeof value === "number") {
        bonuses[key] = (bonuses[key] ?? 0) + value;
      }
    }
  }
  return bonuses;
}

// -----------------------------------------------------------------------------
// ENEMIES — bridge to legacy shape
// -----------------------------------------------------------------------------

export interface CatalogEnemy {
  id: string;
  name: string;
  description: string;
  level: number;
  region: string;
  portraitAssetId: string;
  stats: Record<string, number>;
  rewards: { xp: number; coins: number; honor: number; coinsMin: number; coinsMax: number };
  tags: string[];
}

export const enemyDefinitions: readonly CatalogEnemy[] = catalog.enemies.map((e) => ({
  id: e.id,
  name: e.name,
  description: e.description,
  level: e.level,
  region: e.region,
  portraitAssetId: e.assetId,
  stats: e.stats,
  rewards: {
    xp: e.rewards.xp,
    coins: e.rewards.coinsMin,
    honor: e.rewards.honor,
    coinsMin: e.rewards.coinsMin,
    coinsMax: e.rewards.coinsMax,
  },
  tags: e.tags,
}));

export function getEnemy(enemyId: string | undefined) {
  if (!enemyId) return undefined;
  return enemyDefinitions.find((e) => e.id === enemyId);
}

export function getEnemySpriteImagePath(enemyId: string | undefined): string | undefined {
  return getAssetPathById(getEnemy(enemyId)?.portraitAssetId);
}

// -----------------------------------------------------------------------------
// RANKS
// -----------------------------------------------------------------------------

export interface CatalogRank {
  id: string;
  name: string;
  order: number;
  requiredXp: number;
  requiredHonor: number;
  pay: number;
  description: string;
  unlocks: string[];
}

export const rankDefinitions: readonly CatalogRank[] = catalog.ranks;

export function getRank(rankId: string | undefined) {
  if (!rankId) return undefined;
  return rankDefinitions.find((r) => r.id === rankId);
}

// -----------------------------------------------------------------------------
// MISSIONS
// -----------------------------------------------------------------------------

export interface CatalogMission {
  id: string;
  name: string;
  region: string;
  locationType: string;
  description: string;
  sceneAssetId: string;
  x: number;
  y: number;
  requiredRankId: string;
  minLevel: number;
  fatigueCost: number;
  durationMinutes: number;
  enemyPool: string[];
  lootTableId: string;
  rewards: {
    xpMin: number;
    xpMax: number;
    coinsMin: number;
    coinsMax: number;
    honorMin: number;
    honorMax: number;
  };
  risks: { woundChance: number; eventChance: number };
  tags: string[];
}

export const missionDefinitions: readonly CatalogMission[] = catalog.missions;

export function getMission(missionId: string | undefined) {
  if (!missionId) return undefined;
  return missionDefinitions.find((m) => m.id === missionId);
}

// -----------------------------------------------------------------------------
// WOUNDS
// -----------------------------------------------------------------------------

export interface CatalogWound {
  id: string;
  name: string;
  severity: string;
  description: string;
  effects: Record<string, number>;
  healingCost: number;
  healingHours: number;
  treatmentItems: string[];
  mature: boolean;
  presentation: string;
}

export const woundDefinitions: readonly CatalogWound[] = catalog.wounds;

export function getWound(woundId: string | undefined) {
  if (!woundId) return undefined;
  return woundDefinitions.find((w) => w.id === woundId);
}

// -----------------------------------------------------------------------------
// EVENTS
// -----------------------------------------------------------------------------

export interface CatalogEventChoice {
  id: string;
  label: string;
  effects: Record<string, unknown>;
  result_text?: string;
}

export interface CatalogEvent {
  id: string;
  name: string;
  description: string;
  choices: CatalogEventChoice[];
  mature: boolean;
  presentation: string;
  tags: string[];
}

export const eventDefinitions: readonly CatalogEvent[] = catalog.events;

export function getEvent(eventId: string | undefined) {
  if (!eventId) return undefined;
  return eventDefinitions.find((e) => e.id === eventId);
}

// -----------------------------------------------------------------------------
// TRAINING
// -----------------------------------------------------------------------------

export interface CatalogTraining {
  id: string;
  stat: StatId;
  name: string;
  description: string;
  baseCost: number;
  costScale: number;
  fatigueCost: number;
  requiredRankId: string;
}

export const trainingDefinitions: readonly CatalogTraining[] = catalog.training.map((t) => ({
  ...t,
  stat: t.stat as StatId,
}));

export function getTraining(trainingId: string | undefined) {
  if (!trainingId) return undefined;
  return trainingDefinitions.find((t) => t.id === trainingId);
}

// -----------------------------------------------------------------------------
// CHARACTERS
// -----------------------------------------------------------------------------

export interface CatalogCharacter {
  id: string;
  name: string;
  role: string;
  rankId: string;
  portraitAssetId: string;
  bio: string;
  stats: Record<StatId, number>;
  startingItems: string[];
  tags: string[];
}

export const characterDefinitions: readonly CatalogCharacter[] = catalog.characters.map(
  (c) => ({
    ...c,
    stats: c.stats as Record<StatId, number>,
  }),
);

export function getCharacter(charId: string | undefined) {
  if (!charId) return undefined;
  return characterDefinitions.find((c) => c.id === charId);
}

// -----------------------------------------------------------------------------
// LOOT TABLES
// -----------------------------------------------------------------------------

export interface CatalogLootTable {
  id: string;
  entries: Array<{ itemId: string; weight: number; min: number; max: number }>;
}

export const lootTableDefinitions: readonly CatalogLootTable[] = catalog.lootTables;

export function getLootTable(lootTableId: string | undefined) {
  if (!lootTableId) return undefined;
  return lootTableDefinitions.find((l) => l.id === lootTableId);
}

// -----------------------------------------------------------------------------
// REPORT FRAGMENTS
// -----------------------------------------------------------------------------

export interface CatalogReportFragment {
  id: string;
  type: "opening" | "attack" | "hit" | "miss" | "wound" | "loot" | "victory" | "defeat";
  text: string;
  tags: string[];
}

export const reportFragmentDefinitions: readonly CatalogReportFragment[] = catalog.reportFragments;

export function getReportFragmentsByType(type: CatalogReportFragment["type"]) {
  return reportFragmentDefinitions.filter((f) => f.type === type);
}
