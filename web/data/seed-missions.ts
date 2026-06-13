export const enemies = [
  { id: "hungry_deserters", name: "hungry deserters", power: 1, description: "Men who know drill badly and hunger well." },
  { id: "road_raiders", name: "road raiders", power: 3, description: "Quick knives near broken carts." },
  { id: "enemy_skirmishers", name: "enemy skirmishers", power: 4, description: "Loose shot and fast retreat." },
] as const;

export const missions = [
  { id: "night_watch_rain", title: "Guardia nocturna bajo la lluvia", type: "night_watch", difficulty: 1, enemyId: "hungry_deserters", rewards: { coins: 8, xp: 6, honor: 1 }, fatigue: 8, woundChance: 12, woundId: "fever", lootTableId: "watch_loot", reportTags: ["rain", "watch"] },
  { id: "muddy_road_patrol", title: "Patrulla por el camino embarrado", type: "patrol", difficulty: 2, enemyId: "road_raiders", rewards: { coins: 12, xp: 10, honor: 2 }, fatigue: 10, woundChance: 20, woundId: "shallow_cut", lootTableId: "patrol_loot", reportTags: ["mud", "patrol"] },
  { id: "powder_escort_front", title: "Escolta de pólvora al frente", type: "escort", difficulty: 2, enemyId: "enemy_skirmishers", rewards: { coins: 15, xp: 12, honor: 2 }, fatigue: 12, woundChance: 26, woundId: "powder_burn", lootTableId: "powder_loot", reportTags: ["powder", "escort"] },
] as const;

export const lootTables = [
  { id: "watch_loot", drops: [{ itemId: "hard_bread", quantity: 1 }] },
  { id: "patrol_loot", drops: [{ itemId: "captured_banner_fragment", quantity: 1 }] },
  { id: "powder_loot", drops: [{ itemId: "wet_powder_flask", quantity: 1 }] },
] as const;
