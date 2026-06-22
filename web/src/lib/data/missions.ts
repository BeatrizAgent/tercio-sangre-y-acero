// Mission definitions + lookups + mission scene/sprite resolution. Backed by
// the unified catalog. The shape is bridged here to the legacy
// `MissionDefinition` so the rest of the app keeps working unchanged.

import {
  lootTableDefinitions as catalogLootTables,
  missionDefinitions as catalogMissions,
  getMission as catalogGetMission,
} from "./catalog";
import { getAssetDimensionsById, getAssetPathById } from "./assets";
import type { LootTable, MissionCombatSpriteSet, MissionDefinition, StatId } from "../types";

export interface LootDrop {
  itemId: string;
  quantity: number;
  weight?: number;
  min?: number;
  max?: number;
}

export type { LootTable };

// Bridge catalog loot tables -> legacy LootTable shape (drops with qty/weight).
export const lootTableDefinitions: LootTable[] = catalogLootTables.map((lt) => ({
  id: lt.id,
  description: "",
  drops: lt.entries.map((e) => ({
    itemId: e.itemId,
    quantity: e.min,
    weight: e.weight,
  })),
}));

// Bridge catalog missions -> legacy MissionDefinition.
export const missionDefinitions: MissionDefinition[] = catalogMissions.map((m) => ({
  id: m.id,
  title: m.name,
  type: m.locationType,
  difficulty: m.minLevel,
  // Catalog stores enemyPool; legacy uses single enemyId. Pick the first
  // enemy from the pool as the "primary" for the legacy single-enemy shape.
  enemyId: m.enemyPool[0] ?? "",
  sceneAssetId: m.sceneAssetId,
  rewards: {
    coins: m.rewards.coinsMin,
    xp: m.rewards.xpMin,
    honor: m.rewards.honorMin,
  },
  fatigue: m.fatigueCost,
  woundChance: Math.round(m.risks.woundChance * 100),
  woundId: "",
  lootTableId: m.lootTableId,
  reportTags: [...m.tags],
  x: m.x,
  y: m.y,
  locationType: m.locationType as MissionDefinition["locationType"],
  region: m.region as MissionDefinition["region"],
}));

export function listAvailableMissions() {
  return missionDefinitions;
}

export function getMission(missionId: string) {
  return missionDefinitions.find((mission) => mission.id === missionId);
}

export function getMissionSceneImagePath(missionId: string | undefined): string {
  const mission = missionId ? getMission(missionId) : undefined;
  return (
    getAssetPathById(mission?.sceneAssetId) ??
    "/assets/gpt-bank/scenes/events/night_watch_rain_bg.png"
  );
}

export const missionCombatSpriteSets: MissionCombatSpriteSet[] = [
  missionSpriteSet("team_pikeman", "Piquero", "team"),
  missionSpriteSet("team_arquebusier", "Tirador", "team"),
  missionSpriteSet("team_assistant", "Asistente", "team"),
  missionSpriteSet("team_rodelero", "Rodelero", "team"),
  missionSpriteSet("team_gastador", "Gastador", "team"),
  missionSpriteSet("minion_pike", "Esbirro con pica", "minion"),
  missionSpriteSet("minion_sword", "Esbirro con espada", "minion"),
  missionSpriteSet("minion_arquebus", "Esbirro arcabucero", "minion"),
  missionSpriteSet("enemy_boss_backline", "Jefe de retaguardia", "boss"),
];

export const missionTeamSpriteByRole: Record<string, string> = {
  piquero: "team_pikeman",
  tirador: "team_arquebusier",
  asistente: "team_assistant",
  jinete: "team_rodelero",
  gastador: "team_gastador",
};

export const missionTeamSpriteByStat: Partial<Record<StatId, string>> = {
  pike: "team_pikeman",
  sword: "team_rodelero",
  arquebus: "team_arquebusier",
  discipline: "team_gastador",
  vigor: "team_gastador",
};

export function getMissionCombatSpriteSet(spriteSetId: string | undefined) {
  if (!spriteSetId) return undefined;
  return missionCombatSpriteSets.find((spriteSet) => spriteSet.id === spriteSetId);
}

export function getMissionCombatSpritePath(spriteSetId: string | undefined) {
  const spriteSet = getMissionCombatSpriteSet(spriteSetId);
  return getAssetPathById(spriteSet?.frames.idle.assetId);
}

function missionSpriteFrame(assetId: string, row: number, rowCount: number, fps: number) {
  const [width, height] = getAssetDimensionsById(assetId);
  return {
    assetId,
    frameWidth: width / 3,
    frameHeight: height / rowCount,
    frames: 3,
    fps,
    row,
  };
}

function missionSpriteSet(
  id: string,
  name: string,
  role: MissionCombatSpriteSet["role"],
): MissionCombatSpriteSet {
  const rowCount = role === "boss" ? 2 : 4;
  return {
    id,
    name,
    role,
    frames: {
      idle: missionSpriteFrame(id, 0, rowCount, 4),
      walk: missionSpriteFrame(id, 1, rowCount, 7),
      attack: missionSpriteFrame(id, 2, rowCount, 6),
      hurt: missionSpriteFrame(id, 3, rowCount, 5),
    },
  };
}
