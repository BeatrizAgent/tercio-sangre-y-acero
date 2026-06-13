import { getItem } from "./game-data";
import { getState, saveState } from "./demo-store";
import type { Effects } from "./types";

export async function equipItem(itemId: string) {
  const state = await getState();
  const item = getItem(itemId);
  if (!item) return { ok: false, message: "Unknown item." };
  if (!state.soldier.inventory.some((owned) => owned.itemId === itemId && owned.quantity > 0)) {
    return { ok: false, message: "You do not own that item." };
  }
  state.soldier.equipment[item.slot] = itemId;
  await saveState(state);
  return { ok: true, message: `Equipped ${item.name}.` };
}

export async function unequipItem(slot: keyof Awaited<ReturnType<typeof getState>>["soldier"]["equipment"]) {
  const state = await getState();
  state.soldier.equipment[slot] = null;
  await saveState(state);
}

export function getEquipmentBonuses(equipment: Record<string, string | null>): Effects {
  const bonuses: Effects = {};
  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue;
    const item = getItem(itemId);
    if (!item) continue;
    for (const [key, value] of Object.entries(item.effects)) {
      bonuses[key as keyof Effects] = (bonuses[key as keyof Effects] ?? 0) + Number(value);
    }
  }
  return bonuses;
}
