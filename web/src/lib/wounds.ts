import { woundDefinitions } from "./game-data";
import { getState, saveState } from "./demo-store";

export function getWound(woundId: string) {
  return woundDefinitions.find((wound) => wound.id === woundId);
}

export async function applyWound(woundId: string) {
  const state = await getState();
  state.soldier.wounds.push({ id: `${woundId}_${Date.now()}`, woundId, treated: false });
  await saveState(state);
}

export async function treatWound(woundInstanceId: string) {
  const state = await getState();
  const bandage = state.soldier.inventory.find((item) => item.itemId === "objeto_002");
  if (!bandage || bandage.quantity < 1) return { ok: false, message: "No clean bandage available." };
  const wound = state.soldier.wounds.find((entry) => entry.id === woundInstanceId);
  if (!wound) return { ok: false, message: "Unknown wound." };
  wound.treated = true;
  bandage.quantity -= 1;
  state.soldier.inventory = state.soldier.inventory.filter((item) => item.quantity > 0);
  await saveState(state);
  return { ok: true, message: "Wound treated." };
}
