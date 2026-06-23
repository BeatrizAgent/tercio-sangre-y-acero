import { getRankName } from "@/lib/data/ranks";
import { getSoldierLevel } from "@/lib/domain/recruitment";
import type { Equipment, PublicPlayerProfile, PublicPlayerProfileSummary, Stats } from "@/lib/types";

type PublicProfileRow = {
  id: string;
  name: string;
  rank: string;
  honor: number;
  xp: number;
  fatigue: number;
  reputation: number;
  portraitAssetId?: string | null;
  createdAt: Date;
  stats: Stats;
  equipment?: Partial<Equipment> | null;
  wounds?: { id: string; treated: boolean }[];
  missionResults?: { id: string; success: boolean }[];
  arenaResults?: { id: string; success: boolean }[];
};

export function mapSoldierToPublicPlayerProfile(row: PublicProfileRow): PublicPlayerProfile {
  const equipment = Object.fromEntries(
    Object.entries(row.equipment ?? {}).filter(([, itemId]) => Boolean(itemId)),
  ) as Partial<Equipment>;
  const arenaResults = row.arenaResults ?? [];

  return {
    id: row.id,
    name: row.name,
    rank: row.rank,
    rankName: getRankName(row.rank),
    level: getSoldierLevel(row.xp),
    honor: row.honor,
    xp: row.xp,
    fatigue: row.fatigue,
    reputation: row.reputation,
    portraitAssetId: row.portraitAssetId ?? undefined,
    stats: { ...row.stats },
    equipment,
    openWounds: (row.wounds ?? []).filter((wound) => !wound.treated).length,
    missionCount: row.missionResults?.length ?? 0,
    arenaWins: arenaResults.filter((result) => result.success).length,
    arenaLosses: arenaResults.filter((result) => !result.success).length,
    joinedAt: row.createdAt.toISOString(),
  };
}

export function summarizePublicPlayerProfile(profile: PublicPlayerProfile): PublicPlayerProfileSummary {
  const { stats: _stats, equipment: _equipment, ...summary } = profile;
  return summary;
}

export function sortPublicPlayerProfiles<T extends PublicPlayerProfileSummary>(profiles: T[]): T[] {
  return [...profiles].sort((a, b) => {
    if (b.honor !== a.honor) return b.honor - a.honor;
    if (b.xp !== a.xp) return b.xp - a.xp;
    return a.name.localeCompare(b.name, "es");
  });
}
