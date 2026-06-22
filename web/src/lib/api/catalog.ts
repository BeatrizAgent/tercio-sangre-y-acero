import { getDb } from "@/lib/db";
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
} from "@/lib/data/catalog-bridge";

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getCatalogPayload() {
  if (!hasDatabase()) {
    return {
      source: "catalog-json",
      assets: catalogAssets,
      items: itemDefinitions,
      enemies: catalogEnemies,
      ranks: catalogRanks,
      missions: catalogMissions,
      wounds: catalogWounds,
      events: catalogEvents,
      training: catalogTraining,
      characters: catalogCharacters,
      lootTables: catalogLootTables,
      reportFragments: reportFragmentDefinitions,
    };
  }

  const db = getDb();
  const [
    assets,
    items,
    enemies,
    ranks,
    missions,
    wounds,
    events,
    training,
    characters,
    lootTables,
    reportFragments,
  ] = await Promise.all([
    db.assetDefinition.findMany({ orderBy: { id: "asc" } }),
    db.itemDefinition.findMany({ orderBy: { id: "asc" } }),
    db.enemyDefinition.findMany({ orderBy: { id: "asc" } }),
    db.rankDefinition.findMany({ orderBy: { id: "asc" } }),
    db.missionDefinition.findMany({ orderBy: { id: "asc" } }),
    db.woundDefinition.findMany({ orderBy: { id: "asc" } }),
    db.gameEventDefinition.findMany({ orderBy: { id: "asc" } }),
    db.trainingDefinition.findMany({ orderBy: { stat: "asc" } }),
    db.characterDefinition.findMany({ orderBy: { id: "asc" } }),
    db.lootTable.findMany({ orderBy: { id: "asc" } }),
    db.reportFragment.findMany({ orderBy: { id: "asc" } }),
  ]);

  return {
    source: "postgres",
    assets,
    items,
    enemies,
    ranks,
    missions,
    wounds,
    events,
    training,
    characters,
    lootTables,
    reportFragments,
  };
}

export async function getCatalogCounts() {
  if (!hasDatabase()) {
    return {
      source: "catalog-json",
      assets: catalogAssets.length,
      items: itemDefinitions.length,
      enemies: catalogEnemies.length,
      ranks: catalogRanks.length,
      missions: catalogMissions.length,
      wounds: catalogWounds.length,
      events: catalogEvents.length,
      training: catalogTraining.length,
      characters: catalogCharacters.length,
      lootTables: catalogLootTables.length,
      reportFragments: reportFragmentDefinitions.length,
    };
  }

  const db = getDb();
  const [
    assets,
    items,
    enemies,
    ranks,
    missions,
    wounds,
    events,
    training,
    characters,
    lootTables,
    reportFragments,
  ] = await Promise.all([
    db.assetDefinition.count(),
    db.itemDefinition.count(),
    db.enemyDefinition.count(),
    db.rankDefinition.count(),
    db.missionDefinition.count(),
    db.woundDefinition.count(),
    db.gameEventDefinition.count(),
    db.trainingDefinition.count(),
    db.characterDefinition.count(),
    db.lootTable.count(),
    db.reportFragment.count(),
  ]);

  return {
    source: "postgres",
    assets,
    items,
    enemies,
    ranks,
    missions,
    wounds,
    events,
    training,
    characters,
    lootTables,
    reportFragments,
  };
}
