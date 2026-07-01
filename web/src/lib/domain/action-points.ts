import type { Soldier } from "../types";

export const MAX_ACTION_POINTS = 12;
export const REGEN_TIME_MS = 10 * 60 * 1000; // 10 minutes

export function regenerateActionPoints(
  soldier: Soldier,
  now: Date = new Date(),
): { soldier: Soldier; updated: boolean } {
  const currentPoints = soldier.actionPoints !== undefined ? soldier.actionPoints : MAX_ACTION_POINTS;
  
  if (currentPoints >= MAX_ACTION_POINTS) {
    if (!soldier.lastRegenAt || currentPoints > MAX_ACTION_POINTS) {
      return {
        soldier: {
          ...soldier,
          actionPoints: MAX_ACTION_POINTS,
          lastRegenAt: now.toISOString(),
        },
        updated: true,
      };
    }
    return { soldier, updated: false };
  }

  if (!soldier.lastRegenAt) {
    return {
      soldier: {
        ...soldier,
        actionPoints: currentPoints,
        lastRegenAt: now.toISOString(),
      },
      updated: true,
    };
  }

  const lastRegenTime = new Date(soldier.lastRegenAt).getTime();
  const elapsedMs = now.getTime() - lastRegenTime;

  if (elapsedMs < REGEN_TIME_MS) {
    return { soldier, updated: false };
  }

  const pointsToRegen = Math.floor(elapsedMs / REGEN_TIME_MS);
  const nextPoints = Math.min(MAX_ACTION_POINTS, currentPoints + pointsToRegen);

  let nextRegenAt = soldier.lastRegenAt;
  if (nextPoints >= MAX_ACTION_POINTS) {
    nextRegenAt = now.toISOString();
  } else {
    nextRegenAt = new Date(lastRegenTime + pointsToRegen * REGEN_TIME_MS).toISOString();
  }

  return {
    soldier: {
      ...soldier,
      actionPoints: nextPoints,
      lastRegenAt: nextRegenAt,
    },
    updated: true,
  };
}
