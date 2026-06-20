// Shop inventories: armory (regular) and church (blessings + relics). The
// buy/sell math lives in `lib/domain/shop.ts`.

import { churchShopItems, shopItems } from "../../../data/seed-items";
import type { ShopItem } from "../types";

export const shopInventory: readonly ShopItem[] = shopItems as readonly ShopItem[];
export const churchInventory: readonly ShopItem[] = churchShopItems as readonly ShopItem[];

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
