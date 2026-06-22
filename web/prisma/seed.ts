import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assetDefinitions } from "../src/lib/data/assets";
import { characterDefinitions, spriteSetDefinitions } from "../src/lib/data/characters";
import { recruitmentCandidates } from "../src/lib/data/recruitment";
import { trainingOptions as training } from "../src/lib/data/training";
import { createInitialState } from "../src/lib/demo-store";
import { items, shopItems, churchShopItems } from "../data/seed-items";
import { enemies, lootTables, missions } from "../data/seed-missions";
import { events } from "../data/seed-events";
import { ranks } from "../data/seed-ranks";
import { reportFragments } from "../data/seed-report-fragments";
import { wounds } from "../data/seed-wounds";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function mutableStringArray(values: readonly string[]) {
  return [...values];
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function main() {
  for (const asset of assetDefinitions) {
    await prisma.assetDefinition.upsert({
      where: { id: asset.id },
      update: {
        category: asset.category,
        path: asset.path,
        source: asset.source,
        dimensions: json([...asset.dimensions]),
        transparent: asset.transparent,
        usage: json([...asset.usage]),
        mature: asset.mature,
        presentation: asset.presentation,
      },
      create: {
        id: asset.id,
        category: asset.category,
        path: asset.path,
        source: asset.source,
        dimensions: json([...asset.dimensions]),
        transparent: asset.transparent,
        usage: json([...asset.usage]),
        mature: asset.mature,
        presentation: asset.presentation,
      },
    });
  }

  for (const enemy of enemies) {
    await prisma.enemyDefinition.upsert({
      where: { id: enemy.id },
      update: enemy,
      create: enemy,
    });
  }

  for (const rank of ranks) {
    await prisma.rankDefinition.upsert({
      where: { id: rank.id },
      update: rank,
      create: rank,
    });
  }

  for (const event of events) {
    const data = {
      title: event.title,
      text: event.text,
      assetId: event.assetId,
      mature: event.mature ?? false,
      presentation: event.presentation,
      choices: json(event.choices.map((choice) => ({ ...choice }))),
    };
    await prisma.gameEventDefinition.upsert({
      where: { id: event.id },
      update: data,
      create: { id: event.id, ...data },
    });
  }

  for (const character of characterDefinitions) {
    const data = {
      name: character.name,
      role: character.role,
      rank: character.rank,
      portraitAssetId: character.portraitAssetId,
      tercioAssetId: character.tercioAssetId,
      emotionAssetId: character.emotionAssetId,
      spriteSetId: character.spriteSetId,
      formationSlot: character.formationSlot,
      fatigue: character.fatigue,
      stats: json({ ...character.stats }),
      equipment: json({ ...character.equipment }),
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
    const data = {
      hook: candidate.hook,
      cost: json({ ...candidate.cost }),
      character: json({
        ...candidate.character,
        stats: { ...candidate.character.stats },
        equipment: { ...candidate.character.equipment },
      }),
    };
    await prisma.recruitmentCandidateDefinition.upsert({
      where: { id: candidate.id },
      update: data,
      create: { id: candidate.id, ...data },
    });
  }

  for (const option of training) {
    const data = {
      name: option.name,
      cost: json({ ...option.cost }),
      gain: option.gain,
      fatigue: option.fatigue,
      description: option.description,
    };
    await prisma.trainingDefinition.upsert({
      where: { stat: option.stat },
      update: data,
      create: { stat: option.stat, ...data },
    });
  }

  for (const item of items) {
    const data = {
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
    };
    await prisma.itemDefinition.upsert({
      where: { id: item.id },
      update: data,
      create: { id: item.id, ...data },
    });
  }

  await prisma.shopItem.deleteMany({});
  const allShopItems = [
    ...shopItems.map((item) => ({ shopId: "company_armory", ...item })),
    ...churchShopItems.map((item) => ({ shopId: "church_reliquary", ...item })),
  ];
  for (const shopItem of allShopItems) {
    await prisma.shopItem.create({
      data: {
        id: `${shopItem.shopId}:${shopItem.itemId}`,
        shopId: shopItem.shopId,
        itemId: shopItem.itemId,
        buyPrice: shopItem.buyPrice,
        sellPrice: shopItem.sellPrice,
        stock: shopItem.stock,
      },
    });
  }

  for (const wound of wounds) {
    const data = {
      name: wound.name,
      severity: wound.severity,
      effects: json({ ...wound.effects }),
      description: wound.description,
      treatmentItems: json([...wound.treatmentItems]),
    };
    await prisma.woundDefinition.upsert({
      where: { id: wound.id },
      update: data,
      create: { id: wound.id, ...data },
    });
  }

  for (const mission of missions) {
    const data = {
      title: mission.title,
      type: mission.type,
      difficulty: mission.difficulty,
      enemyId: mission.enemyId,
      sceneAssetId: mission.sceneAssetId,
      rewards: json({ ...mission.rewards }),
      fatigue: mission.fatigue,
      woundChance: mission.woundChance,
      woundId: mission.woundId,
      lootTableId: mission.lootTableId,
      reportTags: mutableStringArray(mission.reportTags),
      x: mission.x,
      y: mission.y,
      locationType: mission.locationType,
      region: mission.region,
    };
    await prisma.missionDefinition.upsert({
      where: { id: mission.id },
      update: data,
      create: { id: mission.id, ...data },
    });
  }

  for (const table of lootTables) {
    const drops = table.drops.map((drop: Record<string, unknown>) => ({ ...drop }));
    await prisma.lootTable.upsert({
      where: { id: table.id },
      update: { drops: json(drops) },
      create: { id: table.id, drops: json(drops) },
    });
  }

  for (const fragment of reportFragments) {
    const data = { ...fragment, tags: mutableStringArray(fragment.tags) };
    await prisma.reportFragment.upsert({
      where: { id: fragment.id },
      update: data,
      create: data,
    });
  }

  const user = await prisma.user.upsert({
    where: { email: "demo@tercio.local" },
    update: {},
    create: { email: "demo@tercio.local", name: "Demo User" },
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

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
