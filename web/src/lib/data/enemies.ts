// Enemy definitions + lookups + portrait path resolver. Backed by the
// unified catalog.

import {
  enemyDefinitions as catalogEnemies,
  getEnemy as catalogGetEnemy,
  getEnemySpriteImagePath as catalogGetSpritePath,
} from "./catalog";
import type { Enemy } from "../types";

// Bridge: catalog enemies have full stats; legacy `Enemy` needs a single
// `power` number. We derive it as the sum of combat stats (pike+sword+arquebus)
// plus half of vigor, mirroring the old `power` heuristic.
function derivePower(stats: Record<string, number>): number {
  return (
    (stats.pike ?? 0) +
    (stats.sword ?? 0) +
    (stats.arquebus ?? 0) +
    Math.floor((stats.vigor ?? 0) / 2) +
    1
  );
}

export const enemyDefinitions: readonly Enemy[] = catalogEnemies.map((e) => ({
  id: e.id,
  name: e.name,
  power: derivePower(e.stats),
  description: e.description,
  portraitAssetId: e.portraitAssetId,
}));

export function getEnemy(enemyId: string | undefined): Enemy | undefined {
  if (!enemyId) return undefined;
  return enemyDefinitions.find((e) => e.id === enemyId);
}

export function getEnemySpriteImagePath(enemyId: string | undefined): string | undefined {
  return catalogGetSpritePath(enemyId);
}
