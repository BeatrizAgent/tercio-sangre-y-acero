// Shop inventories. The armory (regular) and church (relics) inventories are
// derived from the unified catalog's items, using a curated list of IDs.
// The church blessings (mass, confession, banner blessing) remain inline
// because they are services, not inventory items.

import type { ShopItem } from "../types";

// Curated shop stock — IDs reference the unified catalog.
const armoryStock: Array<{ itemId: string; buyPrice: number; sellPrice: number; stock: number }> = [
  { itemId: "weapon_pica_gastada_001", buyPrice: 18, sellPrice: 8, stock: 3 },
  { itemId: "weapon_pica_corta_001", buyPrice: 18, sellPrice: 8, stock: 3 },
  { itemId: "weapon_ropera_ronosa_001", buyPrice: 22, sellPrice: 10, stock: 2 },
  { itemId: "weapon_arcabuz_bisono_001", buyPrice: 42, sellPrice: 20, stock: 1 },
  { itemId: "weapon_pica_ash_001", buyPrice: 70, sellPrice: 30, stock: 2 },
  { itemId: "weapon_cazoleta_001", buyPrice: 80, sellPrice: 35, stock: 2 },
  { itemId: "weapon_mecha_001", buyPrice: 110, sellPrice: 50, stock: 1 },
  { itemId: "chest_gambeson_001", buyPrice: 18, sellPrice: 8, stock: 3 },
  { itemId: "helmet_morion_001", buyPrice: 22, sellPrice: 9, stock: 2 },
  { itemId: "chest_cuirass_001", buyPrice: 50, sellPrice: 22, stock: 1 },
  { itemId: "chest_cuirass_004", buyPrice: 14, sellPrice: 6, stock: 2 },
  { itemId: "trinket_moneda_001", buyPrice: 9, sellPrice: 4, stock: 6 },
  { itemId: "trinket_carta_001", buyPrice: 7, sellPrice: 3, stock: 5 },
  { itemId: "consumable_aceite_001", buyPrice: 3, sellPrice: 1, stock: 10 },
  { itemId: "consumable_aguardiente_001", buyPrice: 14, sellPrice: 6, stock: 5 },
  { itemId: "consumable_vendas_001", buyPrice: 10, sellPrice: 4, stock: 6 },
  { itemId: "consumable_pan_duro_001", buyPrice: 4, sellPrice: 1, stock: 10 },
];

const churchStock: Array<{ itemId: string; buyPrice: number; sellPrice: number; stock: number }> = [
  { itemId: "religious_rosario_001", buyPrice: 12, sellPrice: 5, stock: 5 },
  { itemId: "religious_cruz_001", buyPrice: 8, sellPrice: 3, stock: 8 },
  { itemId: "religious_medalla_001", buyPrice: 25, sellPrice: 11, stock: 3 },
  { itemId: "consumable_unguento_001", buyPrice: 18, sellPrice: 8, stock: 6 },
  { itemId: "consumable_vino_001", buyPrice: 12, sellPrice: 5, stock: 8 },
];

export const shopInventory: readonly ShopItem[] = armoryStock;
export const churchInventory: readonly ShopItem[] = churchStock;

export const churchBlessings = [
  {
    id: "misa_de_marcha",
    name: "Misa de marcha",
    cost: 8,
    effects: { honor: 1, fatigue: -4 },
    description: "Pan negro, cirio corto y una hora de quietud antes de salir al barro.",
  },
  {
    id: "confesion_de_campana",
    name: "Confesion de campana",
    cost: 12,
    effects: { corruption: -8, reputation: 1 },
    description: "El capellan escucha saqueos, deudas y miedo. No absuelve gratis.",
  },
  {
    id: "bendicion_del_estandarte",
    name: "Bendicion del estandarte",
    cost: 20,
    effects: { honor: 2, fatigue: -2, reputation: 1 },
    description: "Cruz sobre pano mojado. La tropa mira el asta y calla un momento.",
  },
] as const;
