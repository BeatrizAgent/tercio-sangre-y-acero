// Arena opponents and lookup. The fight math (power, roll, rewards) lives
// in `lib/domain/arena.ts` (commit 3).

import type { ArenaOpponent } from "../types";

export const arenaOpponents: ArenaOpponent[] = [
  {
    id: "jaime_el_cojo",
    soldierId: "jaime_el_cojo",
    level: 1,
    name: "Jaime el Cojo",
    rank: "maton de taberna",
    portraitAssetId: "asset_enemy_bandolero_001",
    power: 7,
    fatigue: 8,
    woundChance: 12,
    rewards: { coins: 7, xp: 6, honor: 1 },
    style: "Daga baja, hombro sucio, golpe rapido.",
    description: "Un veterano torcido por vino barato y deudas viejas.",
  },
  {
    id: "bruno_de_namur",
    soldierId: "bruno_de_namur",
    level: 2,
    name: "Bruno de Namur",
    rank: "piquero despedido",
    portraitAssetId: "asset_enemy_oficial_001",
    power: 11,
    fatigue: 12,
    woundChance: 20,
    rewards: { coins: 12, xp: 10, honor: 2 },
    style: "Pica corta y empujones contra la empalizada.",
    description: "Sabe formar, sabe caer, y sabe morder cuando pierde.",
  },
  {
    id: "capitan_rojas",
    soldierId: "capitan_rojas",
    level: 4,
    name: "Capitan Rojas",
    rank: "oficial retirado",
    portraitAssetId: "asset_enemy_desertor_001",
    power: 16,
    fatigue: 16,
    woundChance: 28,
    rewards: { coins: 20, xp: 16, honor: 4 },
    style: "Ropera precisa, calma de verdugo, mirada seca.",
    description: "Un noble arruinado que vende duelos como otros venden pan.",
  },
];

export function listArenaOpponents() {
  return arenaOpponents;
}

export function getArenaOpponent(opponentId: string) {
  return arenaOpponents.find((opponent) => opponent.id === opponentId);
}
