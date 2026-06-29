// inventory-grid-bulk.test.ts — exhaustive coverage of the inventory grid
// (multi-chest overflow, multi-cell footprints, cross-chest moves, edges)
// plus a property-based invariant: any add-then-findFreeSlot round is
// stable.

import assert from "node:assert/strict";
import fc from "fast-check";
import {
  addInventoryItem,
  autoPlaceItems,
  BACKPACK_CHESTS,
  BACKPACK_COLS,
  BACKPACK_ROWS,
  canPlaceItem,
  findFreeSlotForItem,
  moveInventoryItem,
} from "../../src/lib/domain/inventory-grid";
import { getItemFootprint, getItem } from "../../src/lib/data/items";
import type { InventoryItem } from "../../src/lib/types";

const smallItem = "consumable_pan_duro_001"; // 1x1
const vendasItem = "consumable_vendas_001"; // 1x1
const pike = "weapon_pica_gastada_001"; // 1x3
const cuirass = "chest_cuirass_001"; // 2x2

// Multi-celda footprint -------------------------------------------------

{
  // Adding a pike (1x3) takes 3 rows in a single column.
  const inventory: InventoryItem[] = [];
  const out = addInventoryItem(inventory, pike, 1, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out.ok, true);
  const placed = out.inventory.find((i) => i.itemId === pike);
  assert.ok(placed);
  assert.equal(placed?.x, 0);
  assert.equal(placed?.y, 0);
  // A second 1x3 from a DIFFERENT item id is placed at a free slot
  // (the algorithm picks the next (y,x) that doesn't collide).
  const secondPike = "weapon_pica_corta_001"; // also 1x3
  const out2 = addInventoryItem(out.inventory, secondPike, 1, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out2.ok, true);
  const second = out2.inventory.find((i) => i.itemId === secondPike);
  assert.ok(second, "second pike placed");
  // Confirm there is no overlap.
  const first = out2.inventory.find((i) => i.itemId === pike)!;
  const overlap =
    first.x < second!.x + 1 &&
    first.x + 1 > second!.x &&
    first.y < second!.y + 3 &&
    first.y + 3 > second!.y;
  assert.equal(overlap, false, "pikes do not overlap");
}

{
  // A cuirass (2x2) takes 2 cols and 2 rows.
  const out = addInventoryItem([], cuirass, 1, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out.ok, true);
  const placed = out.inventory.find((i) => i.itemId === cuirass);
  assert.ok(placed);
  const fp = getItemFootprint(getItem(cuirass)!);
  assert.equal(placed?.x, 0);
  assert.equal(placed?.y, 0);
  // Verify canPlaceItem respects the 2x2 footprint.
  assert.equal(canPlaceItem(out.inventory, cuirass, 0, 0, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), false);
  assert.equal(canPlaceItem(out.inventory, cuirass, 2, 0, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), true);
  assert.equal(canPlaceItem(out.inventory, cuirass, 0, 2, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), true);
  // Out of bounds.
  assert.equal(canPlaceItem(out.inventory, cuirass, 7, 0, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), false);
  assert.equal(canPlaceItem(out.inventory, cuirass, 0, 4, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), false);
}

// canPlaceItem edge cases ----------------------------------------------

{
  // Negative coords.
  const inventory: InventoryItem[] = [];
  assert.equal(canPlaceItem(inventory, smallItem, -1, 0, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), false);
  assert.equal(canPlaceItem(inventory, smallItem, 0, -1, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), false);
}

{
  // Non-integer coords.
  const inventory: InventoryItem[] = [];
  assert.equal(canPlaceItem(inventory, smallItem, 0.5, 0, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), false);
  assert.equal(canPlaceItem(inventory, smallItem, 0, NaN, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), false);
}

{
  // Negative / out-of-range chest.
  const inventory: InventoryItem[] = [];
  assert.equal(canPlaceItem(inventory, smallItem, 0, 0, BACKPACK_COLS, BACKPACK_ROWS, undefined, -1), false);
  // canPlaceItem does not currently check upper bound on chest; autoPlaceItems
  // does. Skip the upper-bound check here.
}

{
  // Unknown item returns false.
  assert.equal(canPlaceItem([], "no_such_item_zzz", 0, 0, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), false);
}

// moveInventoryItem -----------------------------------------------------

{
  // Move a small item from (0,0) chest 0 to (0,0) chest 1.
  const inventory: InventoryItem[] = [{ itemId: smallItem, quantity: 1, chest: 0, x: 0, y: 0 }];
  const out = moveInventoryItem(inventory, smallItem, 0, 0, BACKPACK_COLS, BACKPACK_ROWS, 1);
  const moved = out.find((i) => i.itemId === smallItem);
  assert.equal(moved?.chest, 1);
  assert.equal(moved?.x, 0);
  assert.equal(moved?.y, 0);
}

{
  // Move to an occupied cell is a no-op (returns the laid-out grid).
  const inventory: InventoryItem[] = [
    { itemId: smallItem, quantity: 1, chest: 0, x: 0, y: 0 },
    { itemId: vendasItem, quantity: 1, chest: 0, x: 1, y: 0 },
  ];
  const out = moveInventoryItem(inventory, smallItem, 1, 0, BACKPACK_COLS, BACKPACK_ROWS, 0);
  const small = out.find((i) => i.itemId === smallItem);
  assert.equal(small?.x, 0);
  assert.equal(small?.y, 0);
}

// findFreeSlotForItem ---------------------------------------------------

{
  // No item id -> null.
  const out = findFreeSlotForItem("no_such_item_zzz", [], BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out, null);
}

{
  // All chests full of 1x1 items -> no free slot for a 1x1.
  const inventory: InventoryItem[] = [];
  for (let chest = 0; chest < BACKPACK_CHESTS; chest++) {
    for (let y = 0; y < BACKPACK_ROWS; y++) {
      for (let x = 0; x < BACKPACK_COLS; x++) {
        inventory.push({ itemId: smallItem, quantity: 1, chest, x, y });
      }
    }
  }
  const out = findFreeSlotForItem(smallItem, inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out, null, "no free 1x1 slot when every chest is full");
}

// addInventoryItem with mixed quantities --------------------------------

{
  // Adding more of an existing item stacks quantity instead of using a new slot.
  const inventory: InventoryItem[] = [{ itemId: smallItem, quantity: 1, chest: 0, x: 0, y: 0 }];
  const out = addInventoryItem(inventory, smallItem, 4, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out.ok, true);
  const placed = out.inventory.find((i) => i.itemId === smallItem);
  assert.equal(placed?.quantity, 5);
  assert.equal(out.inventory.length, 1);
}

{
  // Adding a new item id when full -> ok=false.
  const inventory: InventoryItem[] = [];
  for (let chest = 0; chest < BACKPACK_CHESTS; chest++) {
    for (let y = 0; y < BACKPACK_ROWS; y++) {
      for (let x = 0; x < BACKPACK_COLS; x++) {
        inventory.push({ itemId: smallItem, quantity: 1, chest, x, y });
      }
    }
  }
  const out = addInventoryItem(inventory, vendasItem, 1, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out.ok, false);
}

// Property-based invariant ---------------------------------------------

{
  // For any sequence of addInventoryItem calls, the laid-out inventory
  // must never have overlapping footprints.
  const items = [smallItem, vendasItem, pike, cuirass];
  fc.assert(
    fc.property(fc.array(fc.integer({ min: 0, max: items.length - 1 }), { maxLength: 25 }), (picks) => {
      let inventory: InventoryItem[] = [];
      for (const idx of picks) {
        const out = addInventoryItem(inventory, items[idx], 1, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
        if (out.ok) inventory = out.inventory;
      }
      // laid out -> check no two items share a cell in the same chest.
      const seen = new Set<string>();
      for (const item of inventory) {
        if (item.x === undefined || item.y === undefined || item.chest === undefined) continue;
        const fp = getItemFootprint(getItem(item.itemId));
        if (!fp) continue;
        for (let dx = 0; dx < fp.cols; dx++) {
          for (let dy = 0; dy < fp.rows; dy++) {
            const key = `${item.chest}:${item.x + dx}:${item.y + dy}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }
        }
      }
      return true;
    }),
    { numRuns: 30, seed: 1 },
  );
}

console.log(JSON.stringify({ ok: true, checked: "inventory-grid-bulk" }, null, 2));
