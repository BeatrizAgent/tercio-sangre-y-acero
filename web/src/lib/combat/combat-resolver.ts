import { enemyDefinitions, getEquipmentBonuses, getWound } from "@/lib/game-data";
import type { MissionDefinition, Soldier } from "@/lib/types";
import type { CombatPreview, CombatResult } from "./combat-types";

const statLabels: Record<CombatPreview["relevantStat"], string> = {
  pike: "Pica",
  sword: "Espada",
  arquebus: "Arcabuz",
  discipline: "Disciplina",
};

export function getRelevantCombatStat(type: string): CombatPreview["relevantStat"] {
  if (type.includes("escort") || type.includes("skirmish")) return "arquebus";
  if (type.includes("duel")) return "sword";
  if (type.includes("watch")) return "discipline";
  return "pike";
}

export function getCombatPreview(mission: MissionDefinition, soldier: Soldier): CombatPreview {
  const equipmentBonuses = getEquipmentBonuses(soldier.equipment);
  const relevantStat = getRelevantCombatStat(mission.type);
  const statValue = soldier.stats[relevantStat] + Number(equipmentBonuses[relevantStat] ?? 0);
  const disciplineValue = soldier.stats.discipline + Number(equipmentBonuses.discipline ?? 0);
  const vigorValue = soldier.stats.vigor + Number(equipmentBonuses.vigor ?? 0);
  const woundPenalty = soldier.wounds.filter((wound) => !wound.treated).length * 2;
  const fatiguePenalty = Math.floor(soldier.fatigue / 10);
  const playerPower = statValue + disciplineValue + vigorValue - woundPenalty - fatiguePenalty;
  const enemyPower = enemyDefinitions.find((enemy) => enemy.id === mission.enemyId)?.power ?? 0;
  const targetPower = mission.difficulty * 4 + enemyPower;

  return {
    mission,
    soldier,
    relevantStat,
    statLabel: statLabels[relevantStat],
    playerPower,
    targetPower,
    enemyPower,
  };
}

export function buildCombatResult(mission: MissionDefinition, soldier: Soldier): CombatResult {
  const preview = getCombatPreview(mission, soldier);
  const equipmentBonuses = getEquipmentBonuses(soldier.equipment);
  const statValue = soldier.stats[preview.relevantStat] + Number(equipmentBonuses[preview.relevantStat] ?? 0);
  const disciplineValue = soldier.stats.discipline + Number(equipmentBonuses.discipline ?? 0);
  const vigorValue = soldier.stats.vigor + Number(equipmentBonuses.vigor ?? 0);
  const woundPenalty = soldier.wounds.filter((wound) => !wound.treated).length * 2;
  const fatiguePenalty = Math.floor(soldier.fatigue / 10);
  const roll = ((soldier.xp + soldier.honor + mission.id.length) % 5) + 1;
  const total = preview.playerPower + roll;
  const wound = getWound(mission.woundId);

  return {
    success: total >= preview.targetPower,
    roll,
    target: preview.targetPower,
    modifiers: [
      { label: preview.statLabel, value: statValue },
      { label: "Disciplina", value: disciplineValue },
      { label: "Vigor", value: vigorValue },
      ...(woundPenalty > 0 ? [{ label: "Heridas", value: -woundPenalty }] : []),
      ...(fatiguePenalty > 0 ? [{ label: "Fatiga", value: -fatiguePenalty }] : []),
      { label: "Tirada determinista", value: roll },
    ],
    rewards: mission.rewards,
    wounds: wound ? [{ name: wound.name, severity: mission.woundChance >= 30 ? "grave" : mission.woundChance >= 18 ? "media" : "leve" }] : [],
    log: [
      mission.title,
      "La lluvia apaga las mechas mientras la tropa aprieta filas.",
      `${preview.statLabel}, disciplina y vigor deciden la acometida.`,
      "¡Choque de armas! Los aceros colisionan en la niebla.",
    ],
  };
}
