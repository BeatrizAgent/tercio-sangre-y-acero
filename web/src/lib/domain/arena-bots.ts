import { getSoldierLevel } from "./recruitment";
import type { ArenaOpponent, Stats } from "../types";

export interface ArenaBotSoldierSnapshot {
  id: string;
  name: string;
  rank: string;
  xp: number;
  fatigue: number;
  portraitAssetId?: string | null;
  stats: Stats;
}

export interface ArenaBotProfileSnapshot {
  style: string;
  description: string;
  seedOffset: number;
}

export function getArenaBotTargetLevel({
  averageRealLevel,
  seedOffset,
}: {
  averageRealLevel: number;
  seedOffset: number;
}) {
  return Math.max(1, Math.round(averageRealLevel + seedOffset));
}

export function xpForArenaBotLevel(level: number) {
  return Math.max(0, (Math.max(1, level) - 1) * 100);
}

export function buildArenaBotStats({
  targetLevel,
  seedOffset,
}: {
  targetLevel: number;
  seedOffset: number;
}): Stats {
  const base = Math.max(1, Math.floor(targetLevel / 2) + 1);
  const lean = Math.abs(seedOffset) % 3;
  return {
    pike: base + (lean === 0 ? 2 : 0),
    sword: base + (lean === 1 ? 2 : 0),
    arquebus: Math.max(1, base - 1 + (lean === 2 ? 2 : 0)),
    discipline: base + 1,
    vigor: base + 1,
    cunning: Math.max(1, base - 1),
    command: Math.max(0, Math.floor(targetLevel / 8)),
  };
}

export function computeArenaPower(stats: Stats, fatigue = 0) {
  return (
    stats.sword +
    stats.pike +
    stats.vigor +
    stats.discipline +
    stats.command -
    Math.floor(fatigue / 12)
  );
}

export function mapArenaBotToOpponent({
  soldier,
  profile,
}: {
  soldier: ArenaBotSoldierSnapshot;
  profile: ArenaBotProfileSnapshot;
}): ArenaOpponent {
  const level = getSoldierLevel(soldier.xp);
  const power = Math.max(3, computeArenaPower(soldier.stats, soldier.fatigue));
  return {
    id: soldier.id,
    soldierId: soldier.id,
    level,
    name: soldier.name,
    rank: soldier.rank,
    portraitAssetId: soldier.portraitAssetId ?? undefined,
    power,
    fatigue: Math.min(22, 5 + Math.floor(level / 3)),
    woundChance: Math.min(35, 8 + Math.floor(level / 2)),
    rewards: {
      coins: Math.max(4, 5 + level + Math.max(0, profile.seedOffset)),
      xp: Math.max(6, 5 + Math.floor(level * 0.8)),
      honor: Math.max(1, Math.floor(level / 5) + (profile.seedOffset > 1 ? 1 : 0)),
    },
    style: profile.style,
    description: profile.description,
  };
}
