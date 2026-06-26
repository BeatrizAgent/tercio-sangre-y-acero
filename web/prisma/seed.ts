import "dotenv/config";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "node:crypto";
import { createInitialState } from "../src/lib/demo-store";
import { characterNames } from "../src/lib/data/character-names";
import { getNextRank } from "../src/lib/data/ranks";
import { recruitmentCandidates } from "../src/lib/data/recruitment";
import { churchInventory, shopInventory } from "../src/lib/data/shop";
import { spriteSetDefinitions } from "../src/lib/data/characters";
import { normalizeCharacterName, validateCharacterNamePools } from "../src/lib/domain/names";
import { buildArenaBotStats, getArenaBotTargetLevel, xpForArenaBotLevel } from "../src/lib/domain/arena-bots";
import { getSoldierLevel } from "../src/lib/domain/recruitment";
import { buildSystemAuctionPlan, getNextSystemAuctionEnd, SYSTEM_AUCTION_COUNT, systemAuctionStartingBid } from "../src/lib/server/system-auction-plan";
import {
  catalogAssets,
  catalogCharacters,
  catalogEnemies,
  catalogEvents,
  catalogLootTables,
  catalogMissions,
  catalogRanks,
  catalogTraining,
  catalogWounds,
  itemDefinitions,
  reportFragmentDefinitions,
} from "../src/lib/data/catalog-bridge";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_TOKEN_HASH = createHash("sha256").update("tercio_demo_seed_token", "utf8").digest("hex");

const ARENA_BOT_TEMPLATES = [
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

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function assetPath(publicPath: string) {
  return `GPT-ASSETS/${publicPath.replace(/^\/assets\/gpt-bank\//, "")}`;
}

function botTokenHash(id: string) {
  return createHash("sha256").update(`arena_bot:${id}`, "utf8").digest("hex");
}

function botRankId(xp: number) {
  return getNextRank(xp, 0)?.id ?? "bisono";
}

async function seedCharacterNames() {
  validateCharacterNamePools(characterNames);

  const groups = [
    ["first", characterNames.firstNames],
    ["surname", characterNames.surnames],
  ] as const;

  for (const [kind, values] of groups) {
    const normalizedValues = values.map((value) => normalizeCharacterName(value));

    for (const [sortOrder, value] of values.entries()) {
      await prisma.characterName.upsert({
        where: { kind_normalized: { kind, normalized: normalizeCharacterName(value) } },
        update: { value, sortOrder },
        create: { kind, value, normalized: normalizeCharacterName(value), sortOrder },
      });
    }

    await prisma.characterName.deleteMany({
      where: {
        kind,
        normalized: { notIn: normalizedValues },
      },
    });
  }
}

async function seedCatalog() {
  for (const asset of catalogAssets) {
    await prisma.assetDefinition.upsert({
      where: { id: asset.id },
      update: {
        category: asset.kind,
        path: assetPath(asset.publicPath),
        source: "chatgpt_manual",
        dimensions: json([asset.width, asset.height]),
        transparent: true,
        usage: json([...asset.usage]),
        mature: asset.mature,
        presentation: asset.presentation,
      },
      create: {
        id: asset.id,
        category: asset.kind,
        path: assetPath(asset.publicPath),
        source: "chatgpt_manual",
        dimensions: json([asset.width, asset.height]),
        transparent: true,
        usage: json([...asset.usage]),
        mature: asset.mature,
        presentation: asset.presentation,
      },
    });
  }

  for (const enemy of catalogEnemies) {
    const power = Math.max(
      1,
      Math.round(
        (enemy.stats.pike +
          enemy.stats.sword +
          enemy.stats.arquebus +
          enemy.stats.vigor +
          enemy.level) /
          3,
      ),
    );
    await prisma.enemyDefinition.upsert({
      where: { id: enemy.id },
      update: {
        name: enemy.name,
        power,
        description: enemy.description,
        portraitAssetId: enemy.portraitAssetId,
      },
      create: {
        id: enemy.id,
        name: enemy.name,
        power,
        description: enemy.description,
        portraitAssetId: enemy.portraitAssetId,
      },
    });
  }

  for (const rank of catalogRanks) {
    await prisma.rankDefinition.upsert({
      where: { id: rank.id },
      update: {
        name: rank.name,
        minXp: rank.requiredXp,
        minHonor: rank.requiredHonor,
      },
      create: {
        id: rank.id,
        name: rank.name,
        minXp: rank.requiredXp,
        minHonor: rank.requiredHonor,
      },
    });
  }

  for (const event of catalogEvents) {
    await prisma.gameEventDefinition.upsert({
      where: { id: event.id },
      update: {
        title: event.name,
        text: event.description,
        assetId: null,
        mature: event.mature,
        presentation: event.presentation,
        choices: json(event.choices.map((choice) => ({ ...choice }))),
      },
      create: {
        id: event.id,
        title: event.name,
        text: event.description,
        assetId: null,
        mature: event.mature,
        presentation: event.presentation,
        choices: json(event.choices.map((choice) => ({ ...choice }))),
      },
    });
  }

  for (const character of catalogCharacters) {
    const data = {
      name: character.name,
      role: character.role,
      rank: character.rankId,
      portraitAssetId: character.portraitAssetId,
      tercioAssetId: null,
      emotionAssetId: null,
      spriteSetId: null,
      formationSlot: "banquillo",
      fatigue: 0,
      stats: json({ ...character.stats }),
      equipment: json({ startingItems: [...character.startingItems] }),
    };
    await prisma.characterDefinition.upsert({
      where: { id: character.id },
      update: data,
      create: { id: character.id, ...data },
    });
  }

  for (const spriteSet of spriteSetDefinitions) {
    await prisma.spriteSetDefinition.upsert({
      where: { id: spriteSet.id },
      update: { name: spriteSet.name, frames: json({ ...spriteSet.frames }) },
      create: { id: spriteSet.id, name: spriteSet.name, frames: json({ ...spriteSet.frames }) },
    });
  }

  for (const candidate of recruitmentCandidates) {
    await prisma.recruitmentCandidateDefinition.upsert({
      where: { id: candidate.id },
      update: {
        hook: candidate.hook,
        cost: json({ ...candidate.cost }),
        character: json(candidate.character),
      },
      create: {
        id: candidate.id,
        hook: candidate.hook,
        cost: json({ ...candidate.cost }),
        character: json(candidate.character),
      },
    });
  }

  for (const option of catalogTraining) {
    await prisma.trainingDefinition.upsert({
      where: { stat: option.stat },
      update: {
        name: option.name,
        cost: json({ coins: option.baseCost, xp: 0, scale: option.costScale, requiredRankId: option.requiredRankId }),
        gain: 1,
        fatigue: option.fatigueCost,
        description: option.description,
      },
      create: {
        stat: option.stat,
        name: option.name,
        cost: json({ coins: option.baseCost, xp: 0, scale: option.costScale, requiredRankId: option.requiredRankId }),
        gain: 1,
        fatigue: option.fatigueCost,
        description: option.description,
      },
    });
  }

  for (const item of itemDefinitions) {
    await prisma.itemDefinition.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        category: item.category,
        slot: item.slot,
        footprint: json({ ...item.footprint }),
        value: item.value,
        effects: json({ ...item.effects }),
        description: item.description,
        rarity: item.rarity,
        tier: item.tier,
        passives: item.passives ? json(item.passives) : undefined,
        requirements: item.requirements ? json(item.requirements) : undefined,
        assetId: item.assetId,
      },
      create: {
        id: item.id,
        name: item.name,
        category: item.category,
        slot: item.slot,
        footprint: json({ ...item.footprint }),
        value: item.value,
        effects: json({ ...item.effects }),
        description: item.description,
        rarity: item.rarity,
        tier: item.tier,
        passives: item.passives ? json(item.passives) : undefined,
        requirements: item.requirements ? json(item.requirements) : undefined,
        assetId: item.assetId,
      },
    });
  }

  for (const [shopId, rows] of [
    ["company_armory", shopInventory],
    ["field_church", churchInventory],
  ] as const) {
    for (const row of rows) {
      await prisma.shopItem.upsert({
        where: { shopId_itemId: { shopId, itemId: row.itemId } },
        update: { buyPrice: row.buyPrice, sellPrice: row.sellPrice, stock: row.stock },
        create: {
          shopId,
          itemId: row.itemId,
          buyPrice: row.buyPrice,
          sellPrice: row.sellPrice,
          stock: row.stock,
        },
      });
    }
  }

  for (const wound of catalogWounds) {
    const severityMap: Record<string, number> = { minor: 1, moderate: 2, serious: 3, grave: 4 };
    await prisma.woundDefinition.upsert({
      where: { id: wound.id },
      update: {
        name: wound.name,
        severity: severityMap[wound.severity] ?? 1,
        effects: json({ ...wound.effects }),
        description: wound.description,
        treatmentItems: json([...wound.treatmentItems]),
      },
      create: {
        id: wound.id,
        name: wound.name,
        severity: severityMap[wound.severity] ?? 1,
        effects: json({ ...wound.effects }),
        description: wound.description,
        treatmentItems: json([...wound.treatmentItems]),
      },
    });
  }

  for (const mission of catalogMissions) {
    await prisma.missionDefinition.upsert({
      where: { id: mission.id },
      update: {
        title: mission.name,
        type: mission.locationType,
        difficulty: mission.minLevel,
        enemyId: mission.enemyPool[0] ?? "",
        sceneAssetId: mission.sceneAssetId,
        rewards: json({ ...mission.rewards, durationMinutes: mission.durationMinutes, requiredRankId: mission.requiredRankId }),
        fatigue: mission.fatigueCost,
        woundChance: Math.round(mission.risks.woundChance * 100),
        woundId: null,
        lootTableId: mission.lootTableId,
        reportTags: [...mission.tags],
        x: mission.x,
        y: mission.y,
        locationType: mission.locationType,
        region: mission.region,
      },
      create: {
        id: mission.id,
        title: mission.name,
        type: mission.locationType,
        difficulty: mission.minLevel,
        enemyId: mission.enemyPool[0] ?? "",
        sceneAssetId: mission.sceneAssetId,
        rewards: json({ ...mission.rewards, durationMinutes: mission.durationMinutes, requiredRankId: mission.requiredRankId }),
        fatigue: mission.fatigueCost,
        woundChance: Math.round(mission.risks.woundChance * 100),
        woundId: null,
        lootTableId: mission.lootTableId,
        reportTags: [...mission.tags],
        x: mission.x,
        y: mission.y,
        locationType: mission.locationType,
        region: mission.region,
      },
    });
  }

  for (const table of catalogLootTables) {
    await prisma.lootTable.upsert({
      where: { id: table.id },
      update: { drops: json(table.entries.map((entry) => ({ ...entry, quantity: entry.min }))) },
      create: { id: table.id, drops: json(table.entries.map((entry) => ({ ...entry, quantity: entry.min }))) },
    });
  }

  for (const fragment of reportFragmentDefinitions) {
    await prisma.reportFragment.upsert({
      where: { id: fragment.id },
      update: { type: fragment.type, text: fragment.text, tags: [...fragment.tags] },
      create: { id: fragment.id, type: fragment.type, text: fragment.text, tags: [...fragment.tags] },
    });
  }

  await pruneObsoleteCatalogRows();
}

async function pruneObsoleteCatalogRows() {
  const assetIds = catalogAssets.map((asset) => asset.id);
  const enemyIds = catalogEnemies.map((enemy) => enemy.id);
  const rankIds = catalogRanks.map((rank) => rank.id);
  const eventIds = catalogEvents.map((event) => event.id);
  const characterIds = catalogCharacters.map((character) => character.id);
  const trainingStats = catalogTraining.map((option) => option.stat);
  const itemIds = itemDefinitions.map((item) => item.id);
  const woundIds = catalogWounds.map((wound) => wound.id);
  const missionIds = catalogMissions.map((mission) => mission.id);
  const lootTableIds = catalogLootTables.map((table) => table.id);
  const fragmentIds = reportFragmentDefinitions.map((fragment) => fragment.id);
  const shopKeys = new Set([
    ...shopInventory.map((row) => `company_armory:${row.itemId}`),
    ...churchInventory.map((row) => `field_church:${row.itemId}`),
  ]);

  const shopRows = await prisma.shopItem.findMany({ select: { id: true, shopId: true, itemId: true } });
  const staleShopIds = shopRows
    .filter((row) => !shopKeys.has(`${row.shopId}:${row.itemId}`))
    .map((row) => row.id);

  if (staleShopIds.length > 0) {
    await prisma.shopItem.deleteMany({ where: { id: { in: staleShopIds } } });
  }

  await prisma.assetDefinition.deleteMany({ where: { id: { notIn: assetIds } } });
  await prisma.enemyDefinition.deleteMany({ where: { id: { notIn: enemyIds } } });
  await prisma.rankDefinition.deleteMany({ where: { id: { notIn: rankIds } } });
  await prisma.gameEventDefinition.deleteMany({ where: { id: { notIn: eventIds } } });
  await prisma.characterDefinition.deleteMany({ where: { id: { notIn: characterIds } } });
  await prisma.trainingDefinition.deleteMany({ where: { stat: { notIn: trainingStats } } });
  await prisma.lootTable.deleteMany({ where: { id: { notIn: lootTableIds } } });
  await prisma.reportFragment.deleteMany({ where: { id: { notIn: fragmentIds } } });
  await prisma.woundDefinition.deleteMany({
    where: { id: { notIn: woundIds }, active: { none: {} } },
  });
  await prisma.missionDefinition.deleteMany({
    where: { id: { notIn: missionIds }, results: { none: {} } },
  });
  await prisma.itemDefinition.deleteMany({
    where: { id: { notIn: itemIds }, inventory: { none: {} }, shopItems: { none: {} } },
  });
}

async function seedDemoSave() {
  const user = await prisma.user.upsert({
    where: { email: "demo@tercio.local" },
    update: {},
    create: { email: "demo@tercio.local", name: "Demo User", tokenHash: DEMO_TOKEN_HASH },
  });

  const initialState = createInitialState();

  await prisma.soldier.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: initialState.soldier.name,
      rank: initialState.soldier.rank,
      coins: initialState.soldier.coins,
      honor: initialState.soldier.honor,
      xp: initialState.soldier.xp,
      fatigue: initialState.soldier.fatigue,
      unpaidWages: initialState.soldier.unpaidWages,
      reputation: initialState.soldier.reputation,
      corruption: initialState.soldier.corruption,
      banMissionsLeft: initialState.soldier.banMissionsLeft,
      saveState: json(initialState),
      stats: {
        create: { ...initialState.soldier.stats },
      },
      equipment: {
        create: { ...initialState.soldier.equipment },
      },
      inventory: {
        create: initialState.soldier.inventory.map(({ itemId, quantity }) => ({ itemId, quantity })),
      },
    },
  });

  await prisma.gameSave.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, state: json(initialState) },
  });
}

async function seedArenaBots() {
  const realSoldiers = await prisma.soldier.findMany({
    where: { user: { isBot: false } },
    select: { xp: true },
  });
  const averageRealLevel = realSoldiers.length > 0
    ? Math.round(realSoldiers.reduce((sum, soldier) => sum + getSoldierLevel(soldier.xp), 0) / realSoldiers.length)
    : 1;

  for (const [id, name, seedOffset, style, description, portraitAssetId] of ARENA_BOT_TEMPLATES) {
    const targetLevel = getArenaBotTargetLevel({ averageRealLevel, seedOffset });
    const xp = xpForArenaBotLevel(targetLevel);
    const stats = buildArenaBotStats({ targetLevel, seedOffset });
    const user = await prisma.user.upsert({
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

    const soldier = await prisma.soldier.upsert({
      where: { userId: user.id },
      update: { name, rank: botRankId(xp), xp, fatigue: 0, portraitAssetId },
      create: {
        userId: user.id,
        name,
        rank: botRankId(xp),
        coins: 0,
        honor: 0,
        xp,
        fatigue: 0,
        unpaidWages: 0,
        reputation: 0,
        corruption: 0,
        banMissionsLeft: 0,
        portraitAssetId,
      },
    });

    await prisma.soldierStats.upsert({
      where: { soldierId: soldier.id },
      update: stats,
      create: { soldierId: soldier.id, ...stats },
    });

    await prisma.equipment.upsert({
      where: { soldierId: soldier.id },
      update: {},
      create: { soldierId: soldier.id },
    });

    await prisma.arenaBotProfile.upsert({
      where: { soldierId: soldier.id },
      update: { style, description, active: true, seedOffset, lastProgressedAt: new Date() },
      create: { soldierId: soldier.id, style, description, active: true, seedOffset },
    });
  }
}

async function seedSystemAuctions() {
  const active = await prisma.auctionListing.count({
    where: { sellerId: "system", status: "active" },
  });
  if (active >= SYSTEM_AUCTION_COUNT) return;

  const now = new Date();
  const endsAt = getNextSystemAuctionEnd(now);
  const selected = buildSystemAuctionPlan(now, SYSTEM_AUCTION_COUNT - active);

  if (selected.length === 0) return;

  await prisma.auctionListing.createMany({
    data: selected.map(({ item, slotId }, index) => ({
      id: `system_seed_${slotId}_${item.id}_${now.getTime()}_${index}`,
      sellerId: "system",
      itemId: item.id,
      quantity: 1,
      startingBid: systemAuctionStartingBid(item, now, index),
      currentBid: null,
      currentBidderId: null,
      buyoutPrice: null,
      status: "active",
      endsAt,
      createdAt: now,
    })),
  });
}

async function main() {
  await seedCharacterNames();
  await seedCatalog();
  await seedDemoSave();
  await seedArenaBots();
  await seedSystemAuctions();
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
