export const items = [
  { id: "rusty_pike", name: "Rusty Pike", category: "pike", slot: "mainHand", value: 14, effects: { pike: 2, discipline: 1 }, description: "A long pike with a tired head. Still enough to keep a horseman honest." },
  { id: "chipped_sword", name: "Chipped Sword", category: "sword", slot: "mainHand", value: 18, effects: { sword: 2 }, description: "A sidearm with old nicks along the edge." },
  { id: "worn_arquebus", name: "Worn Arquebus", category: "firearm", slot: "firearm", value: 34, effects: { arquebus: 3 }, description: "Heavy matchlock, slow to love and slower to load." },
  { id: "wet_powder_flask", name: "Wet Powder Flask", category: "ammunition", slot: "accessory", value: 6, effects: { arquebus: -1, cunning: 1 }, description: "Powder that has known too much rain." },
  { id: "cheap_morion", name: "Cheap Morion", category: "helmet", slot: "head", value: 16, effects: { vigor: 1 }, description: "Thin iron with a proud shape and little mercy." },
  { id: "dented_cuirass", name: "Dented Cuirass", category: "armor", slot: "body", value: 38, effects: { vigor: 2, discipline: -1 }, description: "A breastplate that has already argued with steel." },
  { id: "patched_doublet", name: "Patched Doublet", category: "clothing", slot: "body", value: 7, effects: { vigor: 1 }, description: "Threadbare cloth under old sweat and new mud." },
  { id: "old_boots", name: "Old Boots", category: "boots", slot: "boots", value: 9, effects: { vigor: 1 }, description: "Cracked leather, still better than marching barefoot." },
  { id: "clean_bandage", name: "Clean Bandage", category: "medicine", slot: "consumable", value: 8, effects: { woundTreatment: 1 }, description: "Washed linen, rare enough that no one wastes it." },
  { id: "wine_skin", name: "Wine Skin", category: "food", slot: "consumable", value: 6, effects: { fatigue: -8 }, description: "Sour wine. Comfort first, regret after." },
  { id: "hard_bread", name: "Hard Bread", category: "food", slot: "consumable", value: 2, effects: { fatigue: -2 }, description: "Bread so dry it sounds like musketry when broken." },
  { id: "doubtful_relic", name: "Doubtful Relic", category: "relic", slot: "accessory", value: 12, effects: { honor: 1 }, description: "A saint's splinter, or someone's trade in fear." },
  { id: "captured_banner_fragment", name: "Captured Banner Fragment", category: "trade_good", slot: "accessory", value: 20, effects: { honor: 2 }, description: "Torn cloth from another company's shame." },
] as const;

export const shopItems = [
  { itemId: "rusty_pike", buyPrice: 18, sellPrice: 8, stock: 3 },
  { itemId: "chipped_sword", buyPrice: 22, sellPrice: 10, stock: 2 },
  { itemId: "worn_arquebus", buyPrice: 42, sellPrice: 20, stock: 1 },
  { itemId: "cheap_morion", buyPrice: 20, sellPrice: 8, stock: 2 },
  { itemId: "dented_cuirass", buyPrice: 45, sellPrice: 20, stock: 1 },
  { itemId: "old_boots", buyPrice: 12, sellPrice: 5, stock: 2 },
  { itemId: "clean_bandage", buyPrice: 9, sellPrice: 4, stock: 6 },
  { itemId: "wine_skin", buyPrice: 7, sellPrice: 3, stock: 5 },
  { itemId: "hard_bread", buyPrice: 3, sellPrice: 1, stock: 10 },
] as const;
