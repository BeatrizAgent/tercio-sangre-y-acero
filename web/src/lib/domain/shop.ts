// Pure shop math: armory + church transactions. Each function returns
// the next state and an ActionResult. State mutation is the caller's job.

import { getItem } from "../data/items";
import { churchBlessings, churchInventory, shopInventory } from "../data/shop";
import { addInventoryItem, BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS } from "./inventory-grid";
import { fail, ok, type ActionResult } from "./result";
import type { GameState } from "../types";

export function buyItemInState(state: GameState, itemId: string): { next: GameState; result: ActionResult } {
  const row = shopInventory.find((item) => item.itemId === itemId);
  if (!row) return { next: state, result: fail("El objeto no está en venta.") };
  if (state.soldier.coins < row.buyPrice) {
    return { next: state, result: fail("Monedas insuficientes.") };
  }
  const inserted = addInventoryItem(
    state.soldier.inventory,
    itemId,
    1,
    BACKPACK_COLS,
    BACKPACK_ROWS,
    BACKPACK_CHESTS,
  );
  if (!inserted.ok) {
    return { next: state, result: fail("No hay espacio en ningún baúl.") };
  }
  const itemDef = getItem(itemId);
  return {
    next: {
      ...state,
      soldier: {
        ...state.soldier,
        coins: state.soldier.coins - row.buyPrice,
        inventory: inserted.inventory,
      },
    },
    result: ok(`Has comprado: ${itemDef?.name ?? itemId}.`),
  };
}

export function sellItemInState(state: GameState, itemId: string): { next: GameState; result: ActionResult } {
  const ownedIdx = state.soldier.inventory.findIndex((item) => item.itemId === itemId);
  if (ownedIdx === -1 || state.soldier.inventory[ownedIdx].quantity < 1) {
    return { next: state, result: fail("No posees este objeto.") };
  }
  const row = shopInventory.find((item) => item.itemId === itemId);
  const value = row?.sellPrice ?? Math.max(1, Math.floor((getItem(itemId)?.value ?? 1) / 2));
  const inventory = [...state.soldier.inventory];
  const owned = inventory[ownedIdx];
  if (owned.quantity > 1) {
    inventory[ownedIdx] = { ...owned, quantity: owned.quantity - 1 };
  } else {
    inventory.splice(ownedIdx, 1);
  }
  const itemDef = getItem(itemId);
  return {
    next: {
      ...state,
      soldier: {
        ...state.soldier,
        inventory: inventory.filter((item) => item.quantity > 0),
        coins: state.soldier.coins + value,
      },
    },
    result: ok(`Has vendido: ${itemDef?.name ?? itemId}.`),
  };
}

export function buyChurchItemInState(state: GameState, itemId: string): { next: GameState; result: ActionResult } {
  const row = churchInventory.find((item) => item.itemId === itemId);
  if (!row) return { next: state, result: fail("El relicario no vende ese objeto.") };
  if (state.soldier.coins < row.buyPrice) {
    return { next: state, result: fail("Doblones insuficientes para el relicario.") };
  }
  const inserted = addInventoryItem(
    state.soldier.inventory,
    itemId,
    1,
    BACKPACK_COLS,
    BACKPACK_ROWS,
    BACKPACK_CHESTS,
  );
  if (!inserted.ok) {
    return { next: state, result: fail("No hay hueco en ningún baúl.") };
  }
  const itemDef = getItem(itemId);
  return {
    next: {
      ...state,
      soldier: {
        ...state.soldier,
        coins: state.soldier.coins - row.buyPrice,
        inventory: inserted.inventory,
      },
    },
    result: ok(`Has comprado en la iglesia: ${itemDef?.name ?? itemId}.`),
  };
}

export function buyChurchBlessingInState(
  state: GameState,
  blessingId: string,
): { next: GameState; result: ActionResult } {
  const blessing = churchBlessings.find((entry) => entry.id === blessingId);
  if (!blessing) return { next: state, result: fail("Bendición no encontrada.") };
  if (state.soldier.coins < blessing.cost) {
    return { next: state, result: fail("Doblones insuficientes para la ofrenda.") };
  }
  const effects = blessing.effects as Partial<Record<"honor" | "fatigue" | "reputation" | "corruption", number>>;
  const soldier = {
    ...state.soldier,
    coins: state.soldier.coins - blessing.cost,
    honor: Math.max(0, state.soldier.honor + Number(effects.honor ?? 0)),
    fatigue: Math.max(0, Math.min(100, state.soldier.fatigue + Number(effects.fatigue ?? 0))),
    reputation: Math.max(-50, Math.min(50, state.soldier.reputation + Number(effects.reputation ?? 0))),
    corruption: Math.max(0, Math.min(100, state.soldier.corruption + Number(effects.corruption ?? 0))),
  };
  return {
    next: { ...state, soldier },
    result: ok(`${blessing.name}: el capellán hace la señal y cobra la ofrenda.`),
  };
}
