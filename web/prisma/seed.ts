import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { items, shopItems } from "../data/seed-items";
import { lootTables, missions } from "../data/seed-missions";
import { reportFragments } from "../data/seed-report-fragments";
import { wounds } from "../data/seed-wounds";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function mutableStringArray(values: readonly string[]) {
  return [...values];
}

async function main() {
  for (const item of items) {
    const data = { ...item, effects: { ...item.effects } };
    await prisma.itemDefinition.upsert({
      where: { id: item.id },
      update: data,
      create: data,
    });
  }

  for (const shopItem of shopItems) {
    await prisma.shopItem.create({ data: shopItem });
  }

  for (const wound of wounds) {
    const data = { ...wound, effects: { ...wound.effects } };
    await prisma.woundDefinition.upsert({
      where: { id: wound.id },
      update: data,
      create: data,
    });
  }

  for (const mission of missions) {
    const data = {
      ...mission,
      rewards: { ...mission.rewards },
      reportTags: mutableStringArray(mission.reportTags),
    };
    await prisma.missionDefinition.upsert({
      where: { id: mission.id },
      update: data,
      create: data,
    });
  }

  for (const table of lootTables) {
    const drops = table.drops.map((drop) => ({ ...drop }));
    await prisma.lootTable.upsert({
      where: { id: table.id },
      update: { drops },
      create: { id: table.id, drops },
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

  await prisma.soldier.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: "Diego de Arce",
      rank: "bisono",
      coins: 25,
      honor: 0,
      xp: 0,
      fatigue: 0,
      unpaidWages: 0,
      reputation: 0,
      stats: {
        create: { pike: 2, sword: 1, arquebus: 1, discipline: 2, vigor: 2, cunning: 1, command: 0 },
      },
      equipment: {
        create: { body: "patched_doublet", mainHand: "rusty_pike" },
      },
      inventory: {
        create: [
          { itemId: "rusty_pike", quantity: 1 },
          { itemId: "patched_doublet", quantity: 1 },
          { itemId: "hard_bread", quantity: 2 },
          { itemId: "clean_bandage", quantity: 2 },
        ],
      },
    },
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
