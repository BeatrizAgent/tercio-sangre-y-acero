// Rank definitions, name lookup, and the "next rank" computation. Backed by
// the unified catalog.

import {
  rankDefinitions as catalogRanks,
  getRank as catalogGetRank,
} from "./catalog";
import type { Rank } from "../types";

// Bridge catalog ranks -> legacy Rank shape (minXp/minHonor instead of
// requiredXp/requiredHonor).
export const rankDefinitions: readonly Rank[] = catalogRanks.map((r) => ({
  id: r.id,
  name: r.name,
  minXp: r.requiredXp,
  minHonor: r.requiredHonor,
}));

export function getRank(rankId: string | undefined) {
  return catalogGetRank(rankId);
}

export function getRankName(rankId: string) {
  return rankDefinitions.find((rank) => rank.id === rankId)?.name ?? rankId;
}

export function getNextRank(xp: number, honor: number) {
  return [...rankDefinitions]
    .reverse()
    .find((rank) => xp >= rank.minXp && honor >= rank.minHonor);
}
