import type { RegionId } from "./types";

export type { RegionId };

export interface BossEntry {
  id: string;
  title: string;
  type: string;
  difficulty: number;
  enemyId: string;
  portraitAssetId?: string;
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
        portraitAssetId: "boss_flandes_1_road_captain",
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
        portraitAssetId: "boss_flandes_2_powder_ambusher",
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
        portraitAssetId: "boss_flandes_3_crossroads_mercenary",
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
        portraitAssetId: "boss_flandes_4_bastion_commander",
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
      { ...stub("italia", 1, "Jefe de Italia I", "skirmish", 2), portraitAssetId: "boss_italia_1_milanese_condottiero" },
      { ...stub("italia", 2, "Jefe de Italia II", "battle", 3), portraitAssetId: "boss_italia_2_neapolitan_mercenary" },
      { ...stub("italia", 3, "Jefe de Italia III", "fortress", 3), portraitAssetId: "boss_italia_3_fortress_castellan" },
      { ...stub("italia", 4, "Jefe de Italia IV", "battle", 4), portraitAssetId: "boss_italia_4_italian_prince_general" },
    ],
  },
  {
    id: "francia",
    name: "Francia",
    description: "Pirineos, Languedoc y guarniciones francesas.",
    x: 36,
    y: 42,
    bosses: [
      { ...stub("francia", 1, "Jefe de Francia I", "road", 2), portraitAssetId: "boss_francia_1_pyrenean_road_captain" },
      { ...stub("francia", 2, "Jefe de Francia II", "skirmish", 3), portraitAssetId: "boss_francia_2_languedoc_skirmisher" },
      { ...stub("francia", 3, "Jefe de Francia III", "battle", 3), portraitAssetId: "boss_francia_3_french_field_commander" },
      { ...stub("francia", 4, "Jefe de Francia IV", "fortress", 4), portraitAssetId: "boss_francia_4_fortress_governor" },
    ],
  },
  {
    id: "inglaterra",
    name: "Inglaterra",
    description: "Canal, mareas y cañones de la reina.",
    x: 22,
    y: 22,
    bosses: [
      { ...stub("inglaterra", 1, "Jefe de Inglaterra I", "road", 2), portraitAssetId: "boss_inglaterra_1_channel_privateer" },
      { ...stub("inglaterra", 2, "Jefe de Inglaterra II", "skirmish", 3), portraitAssetId: "boss_inglaterra_2_queens_skirmish_officer" },
      { ...stub("inglaterra", 3, "Jefe de Inglaterra III", "battle", 3), portraitAssetId: "boss_inglaterra_3_english_field_commander" },
      { ...stub("inglaterra", 4, "Jefe de Inglaterra IV", "fortress", 4), portraitAssetId: "boss_inglaterra_4_coastal_fortress_commander" },
    ],
  },
  {
    id: "africa",
    name: "África del Norte",
    description: "Berberiscos, corsarios y plazas en la costa.",
    x: 56,
    y: 80,
    bosses: [
      {
        ...stub("africa", 1, "Rais de Argel", "skirmish", 2),
        portraitAssetId: "enemy_north_africa_portrait_001_algerian_corsair",
      },
      {
        ...stub("africa", 2, "Comandante de Tunez", "battle", 3),
        portraitAssetId: "enemy_north_africa_portrait_002_tunisian_rais",
      },
      {
        ...stub("africa", 3, "Caudillo del Rif", "fortress", 3),
        portraitAssetId: "enemy_north_africa_portrait_003_rif_warleader",
      },
      {
        ...stub("africa", 4, "Aga jenizaro de la plaza", "battle", 4),
        portraitAssetId: "enemy_north_africa_portrait_004_janissary_officer",
      },
    ],
  },
];

export function getRegion(regionId: RegionId): Region | undefined {
  return regions.find((region) => region.id === regionId);
}
