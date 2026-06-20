// Item lookups, footprints, and image paths. The image path resolver has a
// fallback chain (asset id -> generated icon -> variant) that historically
// lived alongside the data; kept here so the data layer owns the read path.

import { items } from "../../../data/seed-items";
import { assetDefinitions, getAssetPublicPath } from "./assets";
import type { ItemDefinition, ItemFootprint } from "../types";

export const itemDefinitions = items satisfies readonly ItemDefinition[];

export function getItem(itemId: string) {
  return itemDefinitions.find((item) => item.id === itemId);
}

export function getItemFootprint(item: ItemDefinition | undefined): ItemFootprint {
  const footprint = item?.footprint;
  if (
    footprint &&
    Number.isInteger(footprint.cols) &&
    Number.isInteger(footprint.rows) &&
    footprint.cols > 0 &&
    footprint.rows > 0
  ) {
    return footprint;
  }
  return { cols: 1, rows: 1 };
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

// TODO(domain): move to lib/domain/equipment.ts in commit 3. Kept here for
// now because every consumer already imports `getEquipmentBonuses` from
// `@/lib/game-data` and the function operates on item effects.
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
