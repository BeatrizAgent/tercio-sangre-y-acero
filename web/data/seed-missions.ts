import enemiesJson from "./json/enemies.json";
import missionsJson from "./json/missions.json";
import lootTablesJson from "./json/loot_tables.json";
import type { MissionDefinition } from "../src/lib/types";

const rawEnemies = enemiesJson as Array<Record<string, any>>;
const rawMissions = missionsJson as Array<Record<string, any>>;
const rawLootTables = lootTablesJson as Array<Record<string, any>>;

export const enemies = rawEnemies.map((enemy) => ({
  id: enemy.id,
  name: enemy.name,
  power: enemy.power,
  description: enemy.description,
  portraitAssetId: enemy.portraitAssetId,
}));

export const missions: readonly MissionDefinition[] = rawMissions.map((m) => ({
  id: m.id,
  title: m.title,
  type: m.type,
  difficulty: m.difficulty,
  enemyId: m.enemy_id,
  sceneAssetId: m.sceneAssetId,
  rewards: {
    coins: m.rewards.coins,
    xp: m.rewards.xp,
    honor: m.rewards.honor,
  },
  fatigue: m.fatigue,
  woundChance: m.wound_chance,
  woundId: m.wound_id || "",
  lootTableId: m.loot_table || "",
  reportTags: [...m.report_tags],
  x: m.x,
  y: m.y,
  locationType: m.locationType as "road" | "city" | "fortress" | "skirmish" | "battle",
  region: m.region as MissionDefinition["region"],
}));

export const lootTables = rawLootTables.map((lt) => ({
  id: lt.id,
  description: lt.description,
  drops: lt.drops.map((d: Record<string, any>) => ({
    itemId: d.id,
    quantity: d.quantity,
    weight: typeof d.weight === "number" ? d.weight : undefined,
  })),
}));
