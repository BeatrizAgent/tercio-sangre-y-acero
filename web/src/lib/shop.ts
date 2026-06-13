import { getItem, shopInventory } from "./game-data";
import { getState, saveState } from "./demo-store";

export function listShopItems() {
  return shopInventory;
}

export async function buyItem(itemId: string) {
  const state = await getState();
  const row = shopInventory.find((item) => item.itemId === itemId);
  if (!row) return { ok: false, message: "Item not sold here." };
  if (state.soldier.coins < row.buyPrice) return { ok: false, message: "Not enough coins." };
  state.soldier.coins -= row.buyPrice;
  const owned = state.soldier.inventory.find((item) => item.itemId === itemId);
  if (owned) owned.quantity += 1;
  else state.soldier.inventory.push({ itemId, quantity: 1 });
  await saveState(state);
  return { ok: true, message: `Bought ${getItem(itemId)?.name ?? itemId}.` };
}

export async function sellItem(itemId: string) {
  const state = await getState();
  const owned = state.soldier.inventory.find((item) => item.itemId === itemId);
  if (!owned || owned.quantity < 1) return { ok: false, message: "You do not own that item." };
  const row = shopInventory.find((item) => item.itemId === itemId);
  const value = row?.sellPrice ?? Math.max(1, Math.floor((getItem(itemId)?.value ?? 1) / 2));
  owned.quantity -= 1;
  state.soldier.inventory = state.soldier.inventory.filter((item) => item.quantity > 0);
  state.soldier.coins += value;
  await saveState(state);
  return { ok: true, message: `Sold ${getItem(itemId)?.name ?? itemId}.` };
}
