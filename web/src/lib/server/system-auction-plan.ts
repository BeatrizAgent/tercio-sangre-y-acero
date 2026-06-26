import { itemDefinitions } from "../data/catalog-bridge";
import { SYSTEM_AUCTION_COUNT, SYSTEM_AUCTION_PLAN, SYSTEM_AUCTION_REFRESH_HOURS, type SystemAuctionPlanSlotId } from "../data/system-auctions";
import type { ItemDefinition } from "../types";

export { SYSTEM_AUCTION_COUNT, SYSTEM_AUCTION_PLAN, SYSTEM_AUCTION_REFRESH_HOURS };

export interface PlannedSystemAuctionItem {
  item: ItemDefinition;
  slotId: SystemAuctionPlanSlotId;
  slotLabel: string;
}

export function getNextSystemAuctionEnd(now: Date) {
  const endsAt = new Date(now);
  const currentHour = now.getUTCHours();
  const nextHour = currentHour + (SYSTEM_AUCTION_REFRESH_HOURS - (currentHour % SYSTEM_AUCTION_REFRESH_HOURS));
  endsAt.setUTCHours(nextHour, 0, 0, 0);
  return endsAt;
}

export function buildSystemAuctionPlan(now: Date, count = SYSTEM_AUCTION_COUNT): PlannedSystemAuctionItem[] {
  const selected = new Map<string, PlannedSystemAuctionItem>();

  for (const slot of SYSTEM_AUCTION_PLAN) {
    const pool = poolForSlot(slot.id).filter((item) => !selected.has(item.id));
    for (const item of pickMany(pool, slot.count, `${now.toISOString()}:${slot.id}`)) {
      if (selected.size >= count) break;
      selected.set(item.id, { item, slotId: slot.id, slotLabel: slot.label });
    }
  }

  if (selected.size < count) {
    for (const item of pickMany(itemDefinitions.filter((item) => !selected.has(item.id)), count - selected.size, now.toISOString())) {
      selected.set(item.id, { item, slotId: "common", slotLabel: "Reserva" });
    }
  }

  return [...selected.values()].slice(0, count);
}

export function systemAuctionStartingBid(item: ItemDefinition, now: Date, index: number) {
  const salt = hashCode(`${item.id}:${now.toISOString()}:${index}`);
  const rarityFloor = isLegendaryItem(item) ? 0.58 : item.rarity === "rare" ? 0.5 : 0.38;
  return Math.max(1, Math.round(item.value * (rarityFloor + (salt % 30) / 100)));
}

function poolForSlot(slotId: SystemAuctionPlanSlotId) {
  switch (slotId) {
    case "legendary":
      return itemDefinitions.filter(isLegendaryItem);
    case "common":
      return itemDefinitions.filter((item) => item.rarity === "common" && item.slot !== "consumable");
    case "food":
      return itemDefinitions.filter(isFoodItem);
    case "medical":
      return itemDefinitions.filter((item) => isMedicalItem(item));
    case "munition":
      return itemDefinitions.filter((item) => isMunitionItem(item));
  }
}

function isLegendaryItem(item: ItemDefinition) {
  const text = `${item.id} ${item.name}`.toLocaleLowerCase("es");
  return item.rarity === "legendary" || item.rarity === "epic" || text.includes("legendary") || text.includes("maestre") || text.includes("capitan");
}

function isFoodItem(item: ItemDefinition) {
  const text = `${item.id} ${item.name} ${item.category ?? ""}`.toLocaleLowerCase("es");
  return item.slot === "consumable" && /(food|pan|vino|salazon|queso|agua|pasta|aguardiente|tocino)/.test(text);
}

function isMedicalItem(item: ItemDefinition) {
  const text = `${item.id} ${item.name}`.toLocaleLowerCase("es");
  return item.slot === "consumable" && /(venda|unguento|aguja|aceite)/.test(text);
}

function isMunitionItem(item: ItemDefinition) {
  const text = `${item.id} ${item.name}`.toLocaleLowerCase("es");
  return item.slot === "consumable" && /(polvora|plomo|mecha|piedra)/.test(text);
}

function pickMany(pool: readonly ItemDefinition[], count: number, seed: string) {
  if (pool.length <= count) return [...pool];
  const sorted = [...pool].sort((left, right) => hashCode(`${seed}:${left.id}`) - hashCode(`${seed}:${right.id}`));
  return sorted.slice(0, count);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}
