// Rank definitions, name lookup, and the "next rank" computation.
//
// `getNextRank` is technically a derivation from xp + honor, but it lives
// here because its only inputs are the rank table and two numbers. When
// the rank table moves to Django, this file moves with it.

import { ranks } from "../../../data/seed-ranks";
import type { Rank } from "../types";

export const rankDefinitions = ranks as readonly Rank[];

export function getRankName(rankId: string) {
  return rankDefinitions.find((rank) => rank.id === rankId)?.name ?? rankId;
}

export function getNextRank(xp: number, honor: number) {
  return [...rankDefinitions]
    .reverse()
    .find((rank) => xp >= rank.minXp && honor >= rank.minHonor);
}
