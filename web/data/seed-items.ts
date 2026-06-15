import itemsJson from "./json/items.json";
import shopsJson from "./json/shops.json";
import type { ItemDefinition, ShopItem } from "../src/lib/types";

function mapSlot(slot: string): any {
  if (slot === "main_hand") return "mainHand";
  if (slot === "off_hand") return "offHand";
  return slot;
}

function mapEffects(effects: any) {
  const result: any = {};
  for (const [key, val] of Object.entries(effects)) {
    if (key === "wound_treatment") {
      result.woundTreatment = val;
    } else {
      result[key] = val;
    }
  }
  return result;
}

export const items: readonly ItemDefinition[] = itemsJson.map((item) => ({
  id: item.id,
  name: item.name,
  category: item.type,
  slot: mapSlot(item.slot),
  value: item.value,
  effects: mapEffects(item.effects),
  description: item.description,
  assetId: item.assetId,
}));

const armory = shopsJson.find((s) => s.id === "company_armory");
export const shopItems: readonly ShopItem[] = (armory?.inventory ?? []).map((item) => ({
  itemId: item.item_id,
  buyPrice: item.buy_price,
  sellPrice: item.sell_price,
  stock: item.stock,
}));
