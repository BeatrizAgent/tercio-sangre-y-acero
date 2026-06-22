// catalog-bridge.ts — re-exports the raw catalog lists for the Prisma seed
// and other server-side consumers. Prefer the bridged shapes in
// `./assets`, `./items`, etc. for typed access.

export {
  itemDefinitions,
  assetDefinitions as catalogAssets,
  enemyDefinitions as catalogEnemies,
  rankDefinitions as catalogRanks,
  missionDefinitions as catalogMissions,
  woundDefinitions as catalogWounds,
  eventDefinitions as catalogEvents,
  trainingDefinitions as catalogTraining,
  characterDefinitions as catalogCharacters,
  lootTableDefinitions as catalogLootTables,
  reportFragmentDefinitions,
} from "./catalog";
