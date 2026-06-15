import enemiesJson from "./json/enemies.json";
import missionsJson from "./json/missions.json";
import lootTablesJson from "./json/loot_tables.json";
import type { MissionDefinition } from "../src/lib/types";

export const enemies = enemiesJson.map((enemy) => ({
  id: enemy.id,
  name: enemy.name,
  power: enemy.power,
  description: enemy.description,
  portraitAssetId: enemy.portraitAssetId,
}));

export const missions: readonly MissionDefinition[] = missionsJson.map((m) => ({
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
}));

export const lootTables = lootTablesJson.map((lt) => ({
  id: lt.id,
  drops: lt.drops.map((d) => ({
    itemId: d.id,
    quantity: d.quantity,
  })),
}));
