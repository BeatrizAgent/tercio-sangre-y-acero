// Mission definitions + lookups + mission scene/sprite resolution. Combat
// simulation logic lives in `lib/domain/combat/` and `lib/domain/resolver.ts`.

import { lootTables, missions } from "../../../data/seed-missions";
import { getAssetDimensionsById, getAssetPathById } from "./assets";
import type { LootTable, MissionCombatSpriteSet, MissionDefinition, StatId } from "../types";

export interface LootDrop {
  itemId: string;
  quantity: number;
  weight?: number;
}

export type { LootTable };

export const lootTableDefinitions: LootTable[] = lootTables as LootTable[];

export const missionDefinitions: MissionDefinition[] = missions.map((mission) => ({
  ...mission,
  rewards: { ...mission.rewards },
  reportTags: [...mission.reportTags],
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
