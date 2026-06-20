import { enemyDefinitions, lootTableDefinitions, getEquipmentBonuses } from "../game-data";
import { generateReport } from "./reports";
import type { MissionDefinition, MissionResult, Soldier, StatId } from "../types";

export function resolveMission(soldier: Soldier, mission: MissionDefinition): MissionResult {
  const equipmentBonuses = getEquipmentBonuses(soldier.equipment);
  const relevantStat = pickRelevantStat(mission.type);
  const basePower =
    soldier.stats[relevantStat] +
    soldier.stats.discipline +
    soldier.stats.vigor +
    Number(equipmentBonuses[relevantStat] ?? 0) +
    Number(equipmentBonuses.discipline ?? 0) +
    Number(equipmentBonuses.vigor ?? 0);
  const woundPenalty = soldier.wounds.filter((wound) => !wound.treated).length * 2;
  const fatiguePenalty = Math.floor(soldier.fatigue / 10);
  const randomRoll = deterministicRoll(soldier.xp + soldier.honor + mission.id.length);
  const effectivePower = basePower - woundPenalty - fatiguePenalty + randomRoll;
  const enemyPower = enemyDefinitions.find((enemy) => enemy.id === mission.enemyId)?.power ?? 0;
  const target = mission.difficulty * 4 + enemyPower;
  const success = effectivePower >= target;
  const rewards = {
    coins: success ? mission.rewards.coins : Math.floor(mission.rewards.coins / 2),
    xp: mission.rewards.xp,
    honor: success ? mission.rewards.honor : 0,
  };
  const wounds = !success || mission.woundChance + soldier.fatigue >= 35 ? [mission.woundId] : [];
  const loot = success ? pickLoot(mission.lootTableId) : [];
  const bestPower = bestPowerName(soldier, equipmentBonuses);
  const report = generateReport({ success, rewards, fatigue: mission.fatigue, wounds, loot, bestPower }, mission, soldier);

  return {
    id: `report_${Date.now()}`,
    missionId: mission.id,
    success,
    report,
    rewards,
    fatigue: mission.fatigue,
    wounds,
    loot,
    createdAt: new Date().toISOString(),
  };
}

function pickRelevantStat(type: string): StatId {
  if (type.includes("escort") || type.includes("skirmish")) return "arquebus";
  if (type.includes("duel")) return "sword";
  if (type.includes("watch")) return "discipline";
  return "pike";
}

function deterministicRoll(seed: number) {
  return (seed % 5) + 1;
}

function pickLoot(lootTableId: string) {
  const table = lootTableDefinitions.find((entry) => entry.id === lootTableId);
  if (!table) return [];
  const drops = table.drops;
  const hasWeights = drops.some((d) => typeof d.weight === "number");
  if (!hasWeights) {
    return drops.map((drop) => ({ itemId: drop.itemId, quantity: drop.quantity }));
  }
  const total = drops.reduce((s, d) => s + (d.weight ?? 0), 0) || 1;
  const roll = Math.random() * total;
  let acc = 0;
  for (const drop of drops) {
    acc += drop.weight ?? 0;
    if (roll <= acc) {
      return [{ itemId: drop.itemId, quantity: drop.quantity }];
    }
  }
  const last = drops[drops.length - 1];
  return [{ itemId: last.itemId, quantity: last.quantity }];
}

function bestPowerName(soldier: Soldier, equipmentBonuses: Record<string, number | undefined>) {
  const pike = soldier.stats.pike + Number(equipmentBonuses.pike ?? 0);
  const sword = soldier.stats.sword + Number(equipmentBonuses.sword ?? 0);
  const arquebus = soldier.stats.arquebus + Number(equipmentBonuses.arquebus ?? 0);
  if (arquebus >= pike && arquebus >= sword) return "el arcabuz";
  if (sword >= pike) return "la espada";
  return "la pica";
}
