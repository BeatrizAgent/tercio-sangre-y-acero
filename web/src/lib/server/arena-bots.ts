import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";
import { arenaOpponents as fallbackArenaOpponents } from "@/lib/data/arena";
import { getNextRank } from "@/lib/data/ranks";
import {
  buildArenaBotStats,
  getArenaBotTargetLevel,
  mapArenaBotToOpponent,
  xpForArenaBotLevel,
} from "@/lib/domain/arena-bots";
import { getSoldierLevel } from "@/lib/domain/recruitment";
import type { ArenaOpponent, Equipment, Stats } from "@/lib/types";

const BOT_TEMPLATES = [
  ["bot_alonso_barro", "Alonso del Barro", -3, "Pica corta, botas pesadas.", "Aprendió a ganar cansando al rival.", "asset_enemy_bandolero_001"],
  ["bot_mateo_cuerda", "Mateo Cuerda", -2, "Guardia baja y cuchillada breve.", "Viejo mozo de cuerda con más cicatrices que dientes.", "asset_enemy_desertor_001"],
  ["bot_rodrigo_sombra", "Rodrigo Sombra", -2, "Ropera paciente.", "Nunca entra primero; espera el error.", "asset_enemy_oficial_001"],
  ["bot_iñigo_tizon", "Iñigo Tizón", -1, "Arcabuz descargado y golpe de culata.", "Huele a pólvora vieja y vino agrio.", "asset_enemy_bandolero_001"],
  ["bot_garcia_pardo", "García Pardo", -1, "Pica al pecho, paso corto.", "Soldado sin paga que pelea por cena.", "asset_enemy_oficial_001"],
  ["bot_lope_fierro", "Lope Fierro", 0, "Espada recta, hombro firme.", "No presume; cobra y vuelve al banco.", "asset_enemy_desertor_001"],
  ["bot_martin_seco", "Martín Seco", 0, "Tajo seco al antebrazo.", "Pelea como quien parte leña mojada.", "asset_enemy_bandolero_001"],
  ["bot_sancho_niebla", "Sancho Niebla", 1, "Finta lenta, remate rápido.", "Veterano de guardias nocturnas.", "asset_enemy_oficial_001"],
  ["bot_baltasar_rojo", "Baltasar Rojo", 1, "Carga frontal.", "Rompe nariz antes de saludar.", "asset_enemy_desertor_001"],
  ["bot_diego_picas", "Diego Picas", 2, "Pica larga y disciplina.", "Tiene manos de instructor y humor de verdugo.", "asset_enemy_oficial_001"],
  ["bot_hernan_cal", "Hernán Cal", 2, "Rodela alta.", "Aguanta más golpes de los que conviene.", "asset_enemy_bandolero_001"],
  ["bot_capitan_mudo", "Capitán Mudo", 3, "Sin prisa, sin palabra.", "Oficial arruinado, peligro entero.", "asset_enemy_desertor_001"],
] as const;

const EMPTY_EQUIPMENT: Equipment = {
  head: null,
  body: null,
  mainHand: null,
  offHand: null,
  firearm: null,
  accessory: null,
  boots: null,
  consumable: null,
};

function botTokenHash(id: string) {
  return createHash("sha256").update(`arena_bot:${id}`, "utf8").digest("hex");
}

function botRankId(xp: number) {
  return getNextRank(xp, 0)?.id ?? "bisono";
}

async function getAverageRealLevel() {
  const db = getDb();
  const soldiers = await db.soldier.findMany({
    where: { user: { isBot: false } },
    select: { xp: true },
  });
  if (soldiers.length === 0) return 1;
  const total = soldiers.reduce((sum, soldier) => sum + getSoldierLevel(soldier.xp), 0);
  return Math.max(1, Math.round(total / soldiers.length));
}

async function upsertArenaBot(template: (typeof BOT_TEMPLATES)[number], averageRealLevel: number) {
  const [id, name, seedOffset, style, description, portraitAssetId] = template;
  const db = getDb();
  const targetLevel = getArenaBotTargetLevel({ averageRealLevel, seedOffset });
  const targetXp = xpForArenaBotLevel(targetLevel);
  const stats = buildArenaBotStats({ targetLevel, seedOffset });
  const now = new Date();

  const user = await db.user.upsert({
    where: { email: `${id}@arena.tercio.local` },
    update: { name, isBot: true, portraitAssetId },
    create: {
      email: `${id}@arena.tercio.local`,
      name,
      tokenHash: botTokenHash(id),
      isBot: true,
      portraitAssetId,
    },
  });

  const soldier = await db.soldier.upsert({
    where: { userId: user.id },
    update: {
      name,
      rank: botRankId(targetXp),
      xp: { set: targetXp },
      fatigue: 0,
      portraitAssetId,
    },
    create: {
      userId: user.id,
      name,
      rank: botRankId(targetXp),
      coins: 0,
      honor: 0,
      xp: targetXp,
      fatigue: 0,
      unpaidWages: 0,
      reputation: 0,
      corruption: 0,
      banMissionsLeft: 0,
      portraitAssetId,
    },
  });

  await db.soldierStats.upsert({
    where: { soldierId: soldier.id },
    update: stats,
    create: { soldierId: soldier.id, ...stats },
  });

  await db.equipment.upsert({
    where: { soldierId: soldier.id },
    update: EMPTY_EQUIPMENT,
    create: { soldierId: soldier.id, ...EMPTY_EQUIPMENT },
  });

  await db.arenaBotProfile.upsert({
    where: { soldierId: soldier.id },
    update: { style, description, active: true, seedOffset, lastProgressedAt: now },
    create: { soldierId: soldier.id, style, description, active: true, seedOffset, lastProgressedAt: now },
  });
}

async function ensureArenaBotsInDatabase() {
  const averageRealLevel = await getAverageRealLevel();
  for (const template of BOT_TEMPLATES) {
    await upsertArenaBot(template, averageRealLevel);
  }
}

function rowToOpponent(row: {
  id: string;
  name: string;
  rank: string;
  xp: number;
  fatigue: number;
  portraitAssetId: string | null;
  stats: Stats | null;
  arenaBotProfile: { style: string; description: string; seedOffset: number } | null;
}): ArenaOpponent | null {
  if (!row.stats || !row.arenaBotProfile) return null;
  return mapArenaBotToOpponent({
    soldier: {
      id: row.id,
      name: row.name,
      rank: row.rank,
      xp: row.xp,
      fatigue: row.fatigue,
      portraitAssetId: row.portraitAssetId,
      stats: row.stats,
    },
    profile: row.arenaBotProfile,
  });
}

export async function listArenaOpponentsFromDb(): Promise<ArenaOpponent[]> {
  try {
    await ensureArenaBotsInDatabase();
    const db = getDb();
    const rows = await db.soldier.findMany({
      where: { user: { isBot: true }, arenaBotProfile: { active: true } },
      include: { stats: true, arenaBotProfile: true },
      orderBy: [{ xp: "asc" }, { name: "asc" }],
    });
    const opponents = rows
      .map((row) => rowToOpponent({
        ...row,
        stats: row.stats ? { ...row.stats } : null,
      }))
      .filter((opponent): opponent is ArenaOpponent => Boolean(opponent));
    return opponents.length > 0 ? opponents : fallbackArenaOpponents;
  } catch (error) {
    if (process.env.NODE_ENV === "production" || process.env.TERCIO_DEMO_STORE === "database") throw error;
    return fallbackArenaOpponents;
  }
}

export async function getArenaOpponentFromDb(opponentId: string): Promise<ArenaOpponent | null> {
  const opponents = await listArenaOpponentsFromDb();
  return opponents.find((opponent) => opponent.id === opponentId || opponent.soldierId === opponentId) ?? null;
}
