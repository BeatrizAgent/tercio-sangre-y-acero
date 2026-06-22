// Pure wound math: apply a new wound and treat an existing one.

import { fail, ok, type ActionResult } from "./result";
import type { GameState } from "../types";

export function applyWoundInState(state: GameState, woundId: string): { next: GameState; result: ActionResult } {
  const wound = {
    id: `${woundId}_${Date.now()}`,
    woundId,
    treated: false,
  };
  return {
    next: { ...state, soldier: { ...state.soldier, wounds: [...state.soldier.wounds, wound] } },
    result: ok(`Herida aplicada: ${woundId}.`),
  };
}

export function treatWoundInState(
  state: GameState,
  woundInstanceId: string,
): { next: GameState; result: ActionResult } {
  const bandageIdx = state.soldier.inventory.findIndex((item) => item.itemId === "consumable_vendas_001");
  if (bandageIdx === -1 || state.soldier.inventory[bandageIdx].quantity < 1) {
    return { next: state, result: fail("No tienes vendas limpias disponibles.") };
  }
  const woundIdx = state.soldier.wounds.findIndex((entry) => entry.id === woundInstanceId);
  if (woundIdx === -1) {
    return { next: state, result: fail("Herida no encontrada.") };
  }
  const wounds = [...state.soldier.wounds];
  wounds[woundIdx] = { ...wounds[woundIdx], treated: true };
  const inventory = [...state.soldier.inventory];
  const bandage = inventory[bandageIdx];
  inventory[bandageIdx] = { ...bandage, quantity: bandage.quantity - 1 };
  return {
    next: {
      ...state,
      soldier: {
        ...state.soldier,
        wounds,
        inventory: inventory.filter((item) => item.quantity > 0),
      },
    },
    result: ok("Herida vendada con éxito."),
  };
}
