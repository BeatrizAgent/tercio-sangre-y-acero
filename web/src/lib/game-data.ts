import { items, shopItems } from "../../data/seed-items";
import { enemies, lootTables, missions } from "../../data/seed-missions";
import { ranks } from "../../data/seed-ranks";
import { reportFragments } from "../../data/seed-report-fragments";
import { wounds } from "../../data/seed-wounds";
import type { ItemDefinition, MissionDefinition, StatId } from "./types";

export const itemDefinitions = items satisfies readonly ItemDefinition[];
export const missionDefinitions: MissionDefinition[] = missions.map((mission) => ({
  ...mission,
  rewards: { ...mission.rewards },
  reportTags: [...mission.reportTags],
}));
export const shopInventory = shopItems;
export const enemyDefinitions = enemies;
export const lootTableDefinitions = lootTables;
export const rankDefinitions = ranks;
export const reportFragmentDefinitions = reportFragments;
export const woundDefinitions = wounds;

export const trainingOptions: Array<{
  stat: StatId;
  name: string;
  cost: { coins: number; xp: number };
  gain: number;
  fatigue: number;
  description: string;
}> = [
  { stat: "pike", name: "Pike Drill", cost: { coins: 4, xp: 0 }, gain: 1, fatigue: 4, description: "Hours in formation until shoulders burn." },
  { stat: "sword", name: "Sword Yard", cost: { coins: 5, xp: 0 }, gain: 1, fatigue: 5, description: "Dull blades, bruised hands, fewer mistakes." },
  { stat: "arquebus", name: "Match and Powder", cost: { coins: 6, xp: 0 }, gain: 1, fatigue: 4, description: "Slow loading in damp air while the sergeant curses." },
  { stat: "discipline", name: "Company Discipline", cost: { coins: 3, xp: 0 }, gain: 1, fatigue: 3, description: "Stand still, move together, fear later." },
  { stat: "vigor", name: "Pack March", cost: { coins: 2, xp: 0 }, gain: 1, fatigue: 6, description: "Mud road, full pack, no complaint that helps." },
];

export function getItem(itemId: string) {
  return itemDefinitions.find((item) => item.id === itemId);
}

export function getItemImagePath(itemId: string): string {
  if (itemId === "worn_arquebus") {
    return "/assets/generated/icons/arquebus_with_worn_stock_v01.png";
  }
  return `/assets/generated/icons/${itemId}_v01.png`;
}

export function getRankName(rankId: string) {
  return rankDefinitions.find((rank) => rank.id === rankId)?.name ?? rankId;
}

export function getWound(woundId: string) {
  return woundDefinitions.find((wound) => wound.id === woundId);
}

export function getNextRank(xp: number, honor: number) {
  return [...rankDefinitions]
    .reverse()
    .find((rank) => xp >= rank.minXp && honor >= rank.minHonor);
}

export function getEquipmentBonuses(equipment: Record<string, string | null>) {
  const bonuses: Record<string, number> = {};
  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue;
    const item = getItem(itemId);
    if (!item) continue;
    for (const [key, value] of Object.entries(item.effects)) {
      bonuses[key] = (bonuses[key] ?? 0) + Number(value);
    }
  }
  return bonuses;
}

export function listAvailableMissions() {
  return missionDefinitions;
}

export function getMission(missionId: string) {
  return missionDefinitions.find((mission) => mission.id === missionId);
}


