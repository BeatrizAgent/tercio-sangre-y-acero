// Pure equipment math: derive the bonus map from the current loadout, and
// equip/unequip a single item. Both functions return the next state and a
// ActionResult so the caller (Zustand store today, server action tomorrow)
// only handles persistence and revalidation.

import { getItem, getEquipmentBonuses as computeBonuses } from "../data/items";
import { canPlaceItem } from "./inventory-grid";
import { addInventoryItem, BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS } from "./inventory-grid";
import { fail, ok, type ActionResult } from "./result";
import type { Equipment, EquipmentSlot, GameState } from "../types";

export function getEquipmentBonuses(equipment: Equipment) {
  return computeBonuses(equipment as unknown as Record<string, string | null>);
}

export function equipItemInState(
  state: GameState,
  itemId: string,
): { next: GameState; result: ActionResult } {
  const item = getItem(itemId);
  if (!item) return { next: state, result: fail("Objeto desconocido.") };
  if (!state.soldier.inventory.some((owned) => owned.itemId === itemId && owned.quantity > 0)) {
    return { next: state, result: fail("No tienes ese objeto en tu inventario.") };
  }
  const equipment = { ...state.soldier.equipment, [item.slot]: itemId };
  return {
    next: { ...state, soldier: { ...state.soldier, equipment } },
    result: ok(`Equipado: ${item.name}.`),
  };
}

export function unequipItemInState(
  state: GameState,
  slot: EquipmentSlot,
): { next: GameState; result: ActionResult } {
  if (!state.soldier.equipment[slot]) {
    return { next: state, result: fail("No hay nada equipado en esta ranura.") };
  }
  const equipment = { ...state.soldier.equipment, [slot]: null };
  return {
    next: { ...state, soldier: { ...state.soldier, equipment } },
    result: ok("Desequipado con éxito."),
  };
}

// Helper used by the inventory page when a drag-and-drop unequip happens.
export function unequipIntoBackpack(
  state: GameState,
  slot: EquipmentSlot,
): { next: GameState; result: ActionResult } {
  const itemId = state.soldier.equipment[slot];
  if (!itemId) {
    return { next: state, result: fail("No hay nada equipado en esta ranura.") };
  }
  const added = addInventoryItem(
    state.soldier.inventory,
    itemId,
    1,
    BACKPACK_COLS,
    BACKPACK_ROWS,
    BACKPACK_CHESTS,
  );
  if (!added.ok) {
    return { next: state, result: fail("No hay hueco en la mochila.") };
  }
  const equipment = { ...state.soldier.equipment, [slot]: null };
  return {
    next: {
      ...state,
      soldier: {
        ...state.soldier,
        equipment,
        inventory: added.inventory,
      },
    },
    result: ok("Desequipado y guardado en la mochila."),
  };
}

// Re-export so the rest of the app can keep importing from one place.
export { canPlaceItem };
