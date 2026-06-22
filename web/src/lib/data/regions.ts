// Region map and the campaign bosses per region.

import type { Region, RegionId, BossEntry } from "../types";

export type { Region, RegionId, BossEntry };

const stub = (
  region: RegionId,
  slot: number,
  title: string,
  type: string,
  difficulty: number,
): BossEntry => ({
  id: `${region}_boss_${slot}`,
  title,
  type,
  difficulty,
  enemyId: "enemy_desertor_001",
  rewards: { coins: 0, xp: 0, honor: 0 },
  fatigue: 0,
  woundChance: 0,
});

export const regions: readonly Region[] = [
  {
    id: "flandes",
    name: "Flandes",
    description: "Barro, pólvora y ducados protestantes.",
    x: 50,
    y: 26,
      bosses: [
      {
        id: "flandes_boss_1",
        title: "Patrulla por el camino embarrado",
        type: "patrol",
        difficulty: 2,
        enemyId: "enemy_bandolero_camino_001",
        rewards: { coins: 18, xp: 12, honor: 1 },
        fatigue: 6,
        woundChance: 12,
      },
    ],
  },
  {
    id: "italia",
    name: "Italia",
    description: "Ciudades estado, monedas de oro y cañonazos en plaza.",
    x: 64,
    y: 60,
      bosses: [
      {
        id: "italia_boss_1",
        title: "Asedio a una plaza fuerte",
        type: "siege",
        difficulty: 3,
        enemyId: "enemy_piquero_italiano_001",
        rewards: { coins: 26, xp: 18, honor: 2 },
        fatigue: 9,
        woundChance: 18,
      },
    ],
  },
  {
    id: "francia",
    name: "Francia",
    description: "Caminos de herradura, hugonotes y campos quemados.",
    x: 38,
    y: 50,
      bosses: [
      {
        id: "francia_boss_1",
        title: "Escolta de un convoy real",
        type: "escort",
        difficulty: 2,
        enemyId: "enemy_escaramuza_frances_001",
        rewards: { coins: 20, xp: 14, honor: 2 },
        fatigue: 7,
        woundChance: 14,
      },
    ],
  },
  {
    id: "africa",
    name: "África",
    description: "Cal, berberiscos y galeones ardiendo en la costa.",
    x: 50,
    y: 86,
      bosses: [
      {
        id: "africa_boss_1",
        title: "Cacería en costa berberisca",
        type: "raid",
        difficulty: 4,
        enemyId: "enemy_mercenario_001",
        rewards: { coins: 30, xp: 22, honor: 3 },
        fatigue: 10,
        woundChance: 20,
      },
    ],
  },
  {
    id: "inglaterra",
    name: "Inglaterra",
    description: "Lluvia, cañones de marina y una corona que no olvida.",
    x: 22,
    y: 30,
      bosses: [
      {
        id: "inglaterra_boss_1",
        title: "Escolta del estandarte en Plymouth",
        type: "escort",
        difficulty: 3,
        enemyId: "enemy_jinete_001",
        rewards: { coins: 24, xp: 18, honor: 2 },
        fatigue: 8,
        woundChance: 16,
      },
    ],
  },
];
