import { combatAnimationPreset } from "@/lib/combat/animation-presets";
import { enemyDefinitions, getEnemy, getEnemySpriteImagePath, getEquipmentBonuses, getWound } from "@/lib/game-data";
import type { MissionDefinition, Soldier } from "@/lib/types";
import type { CombatEnemy, CombatEventLogEntry, CombatPreview, CombatResult } from "./combat-types";

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
  const enemyDefinition = getEnemy(mission.enemyId);
  const equipmentBonuses = getEquipmentBonuses(soldier.equipment);
  const statValue = soldier.stats[preview.relevantStat] + Number(equipmentBonuses[preview.relevantStat] ?? 0);
  const disciplineValue = soldier.stats.discipline + Number(equipmentBonuses.discipline ?? 0);
  const vigorValue = soldier.stats.vigor + Number(equipmentBonuses.vigor ?? 0);
  const woundPenalty = soldier.wounds.filter((wound) => !wound.treated).length * 2;
  const fatiguePenalty = Math.floor(soldier.fatigue / 10);
  const roll = ((soldier.xp + soldier.honor + mission.id.length) % 5) + 1;
  const total = preview.playerPower + roll;
  const wound = getWound(mission.woundId);
  const success = total >= preview.targetPower;
  const enemy: CombatEnemy = {
    id: enemyDefinition?.id ?? mission.enemyId,
    name: enemyDefinition?.name ?? "enemigo sin registrar",
    description: enemyDefinition?.description ?? "La niebla oculta su bandera y número.",
    power: enemyDefinition?.power ?? 0,
    spritePath: getEnemySpriteImagePath(mission.enemyId),
  };
  const woundSummary = wound
    ? `El cirujano ya prepara vendas por riesgo de ${wound.name.toLowerCase()}.`
    : "El cirujano espera sin abrir todavía el estuche.";
  const eventLog = buildCombatEventLog({
    mission,
    enemy,
    statLabel: preview.statLabel,
    roll,
    total,
    success,
    woundSummary,
  });

  return {
    success,
    roll,
    target: preview.targetPower,
    modifiers: [
      { label: preview.statLabel, value: statValue },
      ...(preview.relevantStat === "discipline" ? [] : [{ label: "Disciplina", value: disciplineValue }]),
      { label: "Vigor", value: vigorValue },
      ...(woundPenalty > 0 ? [{ label: "Heridas", value: -woundPenalty }] : []),
      ...(fatiguePenalty > 0 ? [{ label: "Fatiga", value: -fatiguePenalty }] : []),
      { label: "Tirada determinista", value: roll },
    ],
    rewards: mission.rewards,
    wounds: wound ? [{ name: wound.name, severity: mission.woundChance >= 30 ? "grave" : mission.woundChance >= 18 ? "media" : "leve" }] : [],
    enemy,
    eventLog,
    log: [mission.title, ...eventLog.map((entry) => entry.text)],
  };
}

function buildCombatEventLog({
  mission,
  enemy,
  statLabel,
  roll,
  total,
  success,
  woundSummary,
}: {
  mission: MissionDefinition;
  enemy: CombatEnemy;
  statLabel: string;
  roll: number;
  total: number;
  success: boolean;
  woundSummary: string;
}): CombatEventLogEntry[] {
  return [
    {
      id: "orders",
      at: combatAnimationPreset.fadeInMs,
      phase: "title",
      text: `Orden recibida: ${mission.title}. La compañía forma bajo lluvia y humo.`,
      tone: "neutral",
    },
    {
      id: "enemy",
      at: combatAnimationPreset.deployMs + 300,
      phase: "deployment",
      text: `${enemy.name} aparecen al frente. ${enemy.description}`,
      tone: "danger",
    },
    {
      id: "modifiers",
      at: combatAnimationPreset.modifiersMs,
      phase: "modifiers",
      text: `${statLabel}, disciplina y vigor pesan en la cuenta antes del choque.`,
      tone: "neutral",
    },
    {
      id: "roll",
      at: combatAnimationPreset.shotMs,
      phase: "shot",
      text: `Tirada determinista +${roll}. Poder efectivo ${total} contra objetivo ${mission.difficulty * 4 + enemy.power}.`,
      tone: success ? "success" : "danger",
    },
    {
      id: "clash",
      at: combatAnimationPreset.responseMs,
      phase: "response",
      text: "¡Choque de armas! Acero, barro y pólvora deciden el paso.",
      tone: "danger",
    },
    {
      id: "wounds",
      at: combatAnimationPreset.responseMs + 650,
      phase: "response",
      text: woundSummary,
      tone: "danger",
    },
    {
      id: "outcome",
      at: combatAnimationPreset.outcomeMs,
      phase: "outcome",
      text: success
        ? `Éxito. Se anotan ${mission.rewards.coins} doblones, ${mission.rewards.xp} XP y ${mission.rewards.honor} de honor.`
        : "Fallo. La tropa se repliega con fatiga y menos honra de la esperada.",
      tone: success ? "reward" : "danger",
    },
  ];
}
