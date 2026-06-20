// Enemy definitions + lookups + portrait path resolver.

import { enemies } from "../../../data/seed-missions";
import { getAssetPathById } from "./assets";
import type { Enemy } from "../types";

export const enemyDefinitions = enemies as readonly Enemy[];

export function getEnemy(enemyId: string | undefined) {
  if (!enemyId) return undefined;
  return enemyDefinitions.find((enemy) => enemy.id === enemyId);
}

export function getEnemySpriteImagePath(enemyId: string | undefined): string | undefined {
  const enemy = getEnemy(enemyId);
  return getAssetPathById(enemy?.portraitAssetId);
}
