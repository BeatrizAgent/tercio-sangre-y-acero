import { reportFragmentDefinitions, getItem, getWound } from "../game-data";
import type { MissionDefinition, MissionResult, Soldier } from "../types";

export function generateReport(
  result: Pick<MissionResult, "success" | "rewards" | "fatigue" | "wounds" | "loot"> & { bestPower: string },
  mission: MissionDefinition,
  soldier: Soldier,
) {
  const opening = findFragment("opening", mission.reportTags);
  const outcome = findFragment(result.success ? "success" : "failure", mission.reportTags).replace("{power}", result.bestPower);
  
  const wounds = result.wounds.length 
    ? `Nuevas heridas sufridas: ${result.wounds.map((wId) => getWound(wId)?.name ?? wId).join(", ")}.` 
    : "No se registraron nuevas heridas.";
    
  const loot = result.loot.length 
    ? `Botín obtenido: ${result.loot.map((drop) => `${getItem(drop.itemId)?.name ?? drop.itemId} x${drop.quantity}`).join(", ")}.` 
    : "No se obtuvo ningún botín de valor.";

  return `${opening}\n\n${outcome}\n\n${soldier.name} regresó con ${result.rewards.coins} doblones, ${result.rewards.xp} XP, ${result.rewards.honor} de honor y ${result.fatigue} de fatiga. ${wounds} ${loot}`;
}

function findFragment(type: string, tags: string[]) {
  return (
    reportFragmentDefinitions.find((fragment) => fragment.type === type && fragment.tags.some((tag) => tags.includes(tag)))?.text ??
    reportFragmentDefinitions.find((fragment) => fragment.type === type)?.text ??
    ""
  );
}
