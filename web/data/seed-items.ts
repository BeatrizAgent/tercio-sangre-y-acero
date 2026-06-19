import itemsJson from "./json/items.json";
import shopsJson from "./json/shops.json";
import type { Effects, EquipmentSlot, ItemDefinition, ItemFootprint, ItemRequirements, Passive, Rarity, ShopItem } from "../src/lib/types";

type RawItem = {
  id: string;
  name: string;
  type: string;
  slot: string;
  value: number;
  effects: Record<string, unknown>;
  description: string;
  assetId?: string;
  footprint?: Partial<ItemFootprint>;
  rarity?: Rarity;
  tier?: number;
  passives?: Passive[];
  requirements?: ItemRequirements;
};

type RawShop = {
  id: string;
  inventory?: Array<{
    item_id: string;
    buy_price: number;
    sell_price: number;
    stock: number;
  }>;
};

function mapSlot(slot: string): EquipmentSlot {
  if (slot === "main_hand") return "mainHand";
  if (slot === "off_hand") return "offHand";
  return slot as EquipmentSlot;
}

function mapEffects(effects: Record<string, unknown>): Effects {
  const result: Effects = {};
  for (const [key, val] of Object.entries(effects)) {
    if (typeof val !== "number") continue;
    if (key === "wound_treatment") {
      result.woundTreatment = val;
    } else {
      result[key as keyof Effects] = val;
    }
  }
  return result;
}

function mapFootprint(item: RawItem): ItemFootprint {
  const footprint = item.footprint;
  const cols = footprint?.cols;
  const rows = footprint?.rows;
  if (
    typeof cols === "number" &&
    typeof rows === "number" &&
    Number.isInteger(cols) &&
    Number.isInteger(rows) &&
    cols > 0 &&
    rows > 0
  ) {
    return { cols, rows };
  }
  return { cols: 1, rows: 1 };
}

const rawItems = itemsJson as unknown as RawItem[];

export const items: readonly ItemDefinition[] = rawItems.map((item) => {
  const mapped: ItemDefinition = {
    id: item.id,
    name: item.name,
    category: item.type,
    slot: mapSlot(item.slot),
    footprint: mapFootprint(item),
    value: item.value,
    effects: mapEffects(item.effects),
    description: item.description,
    assetId: item.assetId,
  };
  if (item.rarity) mapped.rarity = item.rarity;
  if (typeof item.tier === "number") mapped.tier = item.tier;
  if (Array.isArray(item.passives) && item.passives.length > 0) {
    mapped.passives = item.passives;
  }
  if (item.requirements) mapped.requirements = item.requirements;
  return mapped;
});

const armory = (shopsJson as RawShop[]).find((s) => s.id === "company_armory");
export const shopItems: readonly ShopItem[] = (armory?.inventory ?? []).map((item) => ({
  itemId: item.item_id,
  buyPrice: item.buy_price,
  sellPrice: item.sell_price,
  stock: item.stock,
}));
