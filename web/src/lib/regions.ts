import type { RegionId } from "./types";

export type { RegionId };

export interface BossEntry {
  id: string;
  title: string;
  type: string;
  difficulty: number;
  enemyId: string;
  rewards: { coins: number; xp: number; honor: number };
  fatigue: number;
  woundChance: number;
  missionId?: string;
}

export interface Region {
  id: RegionId;
  name: string;
  description: string;
  x: number;
  y: number;
  bosses: BossEntry[];
}

const stub = (region: RegionId, slot: number, title: string, type: string, difficulty: number): BossEntry => ({
  id: `${region}_boss_${slot}`,
  title,
  type,
  difficulty,
  enemyId: "hungry_deserters",
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
        enemyId: "road_raiders",
        rewards: { coins: 12, xp: 10, honor: 2 },
        fatigue: 10,
        woundChance: 20,
        missionId: "muddy_road_patrol",
      },
      {
        id: "flandes_boss_2",
        title: "Escolta de pólvora al frente",
        type: "escort",
        difficulty: 2,
        enemyId: "enemy_skirmishers",
        rewards: { coins: 15, xp: 12, honor: 2 },
        fatigue: 12,
        woundChance: 26,
        missionId: "powder_escort_front",
      },
      {
        id: "flandes_boss_3",
        title: "Escaramuza en el cruce de caminos",
        type: "skirmish",
        difficulty: 3,
        enemyId: "road_raiders",
        rewards: { coins: 18, xp: 14, honor: 3 },
        fatigue: 14,
        woundChance: 32,
        missionId: "crossroads_skirmish",
      },
      {
        id: "flandes_boss_4",
        title: "Asalto al baluarte exterior",
        type: "battle",
        difficulty: 4,
        enemyId: "enemy_skirmishers",
        rewards: { coins: 25, xp: 20, honor: 5 },
        fatigue: 22,
        woundChance: 42,
        missionId: "bastion_assault",
      },
    ],
  },
  {
    id: "italia",
    name: "Italia",
    description: "Milán, Nápoles, ducados y príncipes italianos.",
    x: 60,
    y: 56,
    bosses: [
      stub("italia", 1, "Jefe de Italia I", "skirmish", 2),
      stub("italia", 2, "Jefe de Italia II", "battle", 3),
      stub("italia", 3, "Jefe de Italia III", "fortress", 3),
      stub("italia", 4, "Jefe de Italia IV", "battle", 4),
    ],
  },
  {
    id: "francia",
    name: "Francia",
    description: "Pirineos, Languedoc y guarniciones francesas.",
    x: 36,
    y: 42,
    bosses: [
      stub("francia", 1, "Jefe de Francia I", "road", 2),
      stub("francia", 2, "Jefe de Francia II", "skirmish", 3),
      stub("francia", 3, "Jefe de Francia III", "battle", 3),
      stub("francia", 4, "Jefe de Francia IV", "fortress", 4),
    ],
  },
  {
    id: "inglaterra",
    name: "Inglaterra",
    description: "Canal, mareas y cañones de la reina.",
    x: 22,
    y: 22,
    bosses: [
      stub("inglaterra", 1, "Jefe de Inglaterra I", "road", 2),
      stub("inglaterra", 2, "Jefe de Inglaterra II", "skirmish", 3),
      stub("inglaterra", 3, "Jefe de Inglaterra III", "battle", 3),
      stub("inglaterra", 4, "Jefe de Inglaterra IV", "fortress", 4),
    ],
  },
  {
    id: "africa",
    name: "África del Norte",
    description: "Berberiscos, corsarios y plazas en la costa.",
    x: 56,
    y: 80,
    bosses: [
      stub("africa", 1, "Jefe del Magreb I", "skirmish", 2),
      stub("africa", 2, "Jefe del Magreb II", "battle", 3),
      stub("africa", 3, "Jefe del Magreb III", "fortress", 3),
      stub("africa", 4, "Jefe del Magreb IV", "battle", 4),
    ],
  },
];

export function getRegion(regionId: RegionId): Region | undefined {
  return regions.find((region) => region.id === regionId);
}
