import { getItem } from "./game-data";
import { getState, saveState } from "./demo-store";

export async function addItem(itemId: string, quantity: number) {
  const state = await getState();
  const row = state.soldier.inventory.find((item) => item.itemId === itemId);
  if (row) row.quantity += quantity;
  else state.soldier.inventory.push({ itemId, quantity });
  await saveState(state);
}

export async function removeItem(itemId: string, quantity: number) {
  const state = await getState();
  const row = state.soldier.inventory.find((item) => item.itemId === itemId);
  if (!row || row.quantity < quantity) return false;
  row.quantity -= quantity;
  state.soldier.inventory = state.soldier.inventory.filter((item) => item.quantity > 0);
  await saveState(state);
  return true;
}

export function describeInventoryItem(itemId: string) {
  return getItem(itemId);
}
