import { addInventoryItem, BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS } from "./inventory-grid";
import { fail, ok, type ActionResult } from "./result";
import type { GameState } from "../types";

export interface RotatingShopItem {
  itemId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

export function buyRotatingShopItemInState(
  state: GameState,
  stock: RotatingShopItem,
): { next: GameState; stock: RotatingShopItem; result: ActionResult } {
  if (stock.stock <= 0) {
    return {
      next: state,
      stock: { ...stock, stock: 0 },
      result: fail("El puesto se ha quedado sin existencias."),
    };
  }
  if (state.soldier.coins < stock.buyPrice) {
    return { next: state, stock, result: fail("Monedas insuficientes.") };
  }

  const inserted = addInventoryItem(
    state.soldier.inventory,
    stock.itemId,
    1,
    BACKPACK_COLS,
    BACKPACK_ROWS,
    BACKPACK_CHESTS,
  );
  if (!inserted.ok) return { next: state, stock, result: fail("No hay espacio en ningun baul.") };

  const nextStock = { ...stock, stock: Math.max(0, stock.stock - 1) };
  return {
    next: {
      ...state,
      soldier: {
        ...state.soldier,
        coins: state.soldier.coins - stock.buyPrice,
        inventory: inserted.inventory,
      },
    },
    stock: nextStock,
    result: ok("Compra anotada en el libro del armero."),
  };
}
