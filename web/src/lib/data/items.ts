// Item lookups, footprints, and image paths. The catalog is the single source
// of truth; this module re-exports the legacy ItemDefinition shape so the
// rest of the app keeps working unchanged.

import {
  getItem as catalogGetItem,
  getItemFootprint as catalogGetItemFootprint,
  itemDefinitions as catalogItems,
} from "./catalog";
import { assetDefinitions, getAssetPublicPath } from "./assets";
import type { ItemDefinition, ItemFootprint } from "../types";

export const itemDefinitions: readonly ItemDefinition[] = catalogItems;

export function getItem(itemId: string | undefined) {
  return catalogGetItem(itemId);
}

export function getItemFootprint(item: ItemDefinition | undefined): ItemFootprint {
  return catalogGetItemFootprint(item);
}

const PREFERRED_VARIANTS: Record<string, string> = {
  cheap_morion: "v03",
  chipped_sword: "v03",
  dented_cuirass: "v03",
  worn_arquebus: "v01",
};

export function getItemImagePath(itemId: string): string {
  const item = getItem(itemId);
  const asset = assetDefinitions.find((entry) => entry.id === item?.assetId);
  if (asset) return getAssetPublicPath(asset);

  if (itemId === "worn_arquebus") {
    return `/assets/generated/icons/arquebus_with_worn_stock_${PREFERRED_VARIANTS[itemId]}.png`;
  }
  return `/assets/generated/icons/${itemId}_${PREFERRED_VARIANTS[itemId] ?? "v01"}.png`;
}

export function getEquipmentBonuses(equipment: Record<string, string | null>) {
  const bonuses: Record<string, number> = {};
  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue;
    const item = getItem(itemId);
    if (!item) continue;
    for (const [key, value] of Object.entries(item.effects)) {
      bonuses[key] = (bonuses[key] ?? 0) + Number(value);
    }
  }
  return bonuses;
}
