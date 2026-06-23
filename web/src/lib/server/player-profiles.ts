import { getDb } from "@/lib/db";
import {
  mapSoldierToPublicPlayerProfile,
  sortPublicPlayerProfiles,
  summarizePublicPlayerProfile,
} from "@/lib/domain/player-profiles";
import type { Equipment, PublicPlayerProfile, PublicPlayerProfileSummary, Stats } from "@/lib/types";

const EQUIPMENT_SLOTS = [
  "head",
  "body",
  "mainHand",
  "offHand",
  "firearm",
  "accessory",
  "boots",
  "consumable",
] as const;

function pickStats(stats: Stats | null): Stats | null {
  if (!stats) return null;
  return {
    pike: stats.pike,
    sword: stats.sword,
    arquebus: stats.arquebus,
    discipline: stats.discipline,
    vigor: stats.vigor,
    cunning: stats.cunning,
    command: stats.command,
  };
}

function pickEquipment(equipment: Record<string, string | null> | null): Partial<Equipment> {
  if (!equipment) return {};
  return Object.fromEntries(
    EQUIPMENT_SLOTS.map((slot) => [slot, equipment[slot] ?? null]).filter(([, itemId]) => Boolean(itemId)),
  ) as Partial<Equipment>;
}

type PublicSoldierRow = {
  id: string;
  name: string;
  rank: string;
  honor: number;
  xp: number;
  fatigue: number;
  reputation: number;
  portraitAssetId: string | null;
  user: { createdAt: Date; portraitAssetId: string | null };
  stats: (Stats & { id?: string; soldierId?: string }) | null;
  equipment: (Record<string, string | null> & { id?: string; soldierId?: string }) | null;
  wounds: { id: string; treated: boolean }[];
  results: { id: string; success: boolean }[];
};

function rowToPublicProfile(row: PublicSoldierRow): PublicPlayerProfile | null {
  const stats = pickStats(row.stats ? { ...row.stats } : null);
  if (!stats) return null;

  return mapSoldierToPublicPlayerProfile({
    id: row.id,
    name: row.name,
    rank: row.rank,
    honor: row.honor,
    xp: row.xp,
    fatigue: row.fatigue,
    reputation: row.reputation,
    portraitAssetId: row.portraitAssetId ?? row.user.portraitAssetId,
    createdAt: row.user.createdAt,
    stats,
    equipment: pickEquipment(row.equipment),
    wounds: row.wounds.map((wound) => ({ id: wound.id, treated: wound.treated })),
    missionResults: row.results.map((result) => ({ id: result.id, success: result.success })),
    arenaResults: [],
  });
}

function shouldUseEmptyFallback() {
  return process.env.NODE_ENV !== "production" && process.env.TERCIO_DEMO_STORE !== "database";
}

export async function listPublicPlayerProfilesFromDb(): Promise<PublicPlayerProfileSummary[]> {
  try {
    const db = getDb();
    const rows = await db.soldier.findMany({
      where: { user: { isBot: false } },
      include: {
        user: { select: { createdAt: true, portraitAssetId: true } },
        stats: true,
        equipment: true,
        wounds: true,
        results: { select: { id: true, success: true } },
      },
      orderBy: [{ honor: "desc" }, { xp: "desc" }, { name: "asc" }],
      take: 100,
    });

    return sortPublicPlayerProfiles(
      rows
        .map(rowToPublicProfile)
        .filter((profile): profile is PublicPlayerProfile => Boolean(profile))
        .map(summarizePublicPlayerProfile),
    );
  } catch (error) {
    if (shouldUseEmptyFallback()) return [];
    throw error;
  }
}

export async function getPublicPlayerProfileFromDb(soldierId: string): Promise<PublicPlayerProfile | null> {
  try {
    const db = getDb();
    const row = await db.soldier.findFirst({
      where: { id: soldierId, user: { isBot: false } },
      include: {
        user: { select: { createdAt: true, portraitAssetId: true } },
        stats: true,
        equipment: true,
        wounds: true,
        results: { select: { id: true, success: true } },
      },
    });
    return row ? rowToPublicProfile(row) : null;
  } catch (error) {
    if (shouldUseEmptyFallback()) return null;
    throw error;
  }
}
