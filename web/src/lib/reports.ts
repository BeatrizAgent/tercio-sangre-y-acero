import { reportFragmentDefinitions } from "./game-data";
import type { MissionDefinition, MissionResult, Soldier } from "./types";

export function generateReport(
  result: Pick<MissionResult, "success" | "rewards" | "fatigue" | "wounds" | "loot"> & { bestPower: string },
  mission: MissionDefinition,
  soldier: Soldier,
) {
  const opening = findFragment("opening", mission.reportTags);
  const outcome = findFragment(result.success ? "success" : "failure", mission.reportTags).replace("{power}", result.bestPower);
  const wounds = result.wounds.length ? `Fresh wound recorded: ${result.wounds.join(", ")}.` : "No fresh wound was recorded.";
  const loot = result.loot.length ? `Loot: ${result.loot.map((drop) => `${drop.itemId} x${drop.quantity}`).join(", ")}.` : "No useful loot was taken.";

  return `${opening}\n\n${outcome}\n\n${soldier.name} returned with ${result.rewards.coins} coins, ${result.rewards.xp} XP, ${result.rewards.honor} honor, and ${result.fatigue} fatigue. ${wounds} ${loot}`;
}

function findFragment(type: string, tags: string[]) {
  return (
    reportFragmentDefinitions.find((fragment) => fragment.type === type && fragment.tags.some((tag) => tags.includes(tag)))?.text ??
    reportFragmentDefinitions.find((fragment) => fragment.type === type)?.text ??
    ""
  );
}
