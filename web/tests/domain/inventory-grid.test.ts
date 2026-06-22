import assert from "node:assert/strict";
import {
  autoPlaceItems,
  addInventoryItem,
  canPlaceItem,
  moveInventoryItem,
  findFreeSlotForItem,
  BACKPACK_COLS,
  BACKPACK_ROWS,
  BACKPACK_CHESTS,
} from "../../src/lib/domain/inventory-grid";
import type { InventoryItem } from "../../src/lib/types";

const smallItem = "consumable_pan_duro_001"; // 1x1
const otherSmallItem = "consumable_vendas_001"; // 1x1

{
  const inventory: InventoryItem[] = [];
  const out = addInventoryItem(inventory, smallItem, 1, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out.ok, true, "add to empty inventory succeeds");
  assert.equal(out.inventory.length, 1, "one item placed");
  assert.equal(out.inventory[0].itemId, smallItem);
  assert.equal(typeof out.inventory[0].x, "number", "position assigned");
  assert.equal(typeof out.inventory[0].y, "number");
}

{
  // Adding more of an existing item stacks quantity instead of using new slot.
  const inventory: InventoryItem[] = [{ itemId: smallItem, quantity: 1, chest: 0, x: 0, y: 0 }];
  const out = addInventoryItem(inventory, smallItem, 2, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out.ok, true, "stack add succeeds");
  assert.equal(out.inventory.length, 1, "still one stack");
  assert.equal(out.inventory[0].quantity, 3, "quantity stacked");
}

{
  // Fill every slot in every chest so nothing else fits.
  const inventory: InventoryItem[] = [];
  for (let chest = 0; chest < BACKPACK_CHESTS; chest++) {
    for (let y = 0; y < BACKPACK_ROWS; y++) {
      for (let x = 0; x < BACKPACK_COLS; x++) {
        inventory.push({ itemId: smallItem, quantity: 1, chest, x, y });
      }
    }
  }
  const out = addInventoryItem(inventory, otherSmallItem, 1, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out.ok, false, "add fails when all chests full");
}

{
  const inventory: InventoryItem[] = [{ itemId: smallItem, quantity: 1, chest: 0, x: 0, y: 0 }];
  assert.equal(canPlaceItem(inventory, smallItem, 0, 1, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), true, "free cell is placeable");
  assert.equal(canPlaceItem(inventory, smallItem, 0, 0, BACKPACK_COLS, BACKPACK_ROWS, undefined, 0), false, "occupied cell blocked");
}

{
  // Move item within grid.
  const inventory: InventoryItem[] = [{ itemId: smallItem, quantity: 1, chest: 0, x: 0, y: 0 }];
  const out = moveInventoryItem(inventory, smallItem, 3, 2, BACKPACK_COLS, BACKPACK_ROWS, 0);
  const moved = out.find((i) => i.itemId === smallItem);
  assert.equal(moved?.x, 3, "x updated");
  assert.equal(moved?.y, 2, "y updated");
}

{
  // autoPlaceItems preserves already-positioned items.
  const inventory: InventoryItem[] = [
    { itemId: smallItem, quantity: 1, chest: 0, x: 0, y: 0 },
    { itemId: otherSmallItem, quantity: 1 }, // unpositioned
  ];
  const out = autoPlaceItems(inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.equal(out.length, 2, "all items placed");
  const positioned = out.find((i) => i.itemId === otherSmallItem);
  assert.equal(typeof positioned?.x, "number", "unpositioned item got coordinates");
}

{
  // Multiple chests: item can be placed in chest 1 even if chest 0 is full.
  const inventory: InventoryItem[] = [];
  for (let y = 0; y < BACKPACK_ROWS; y++) {
    for (let x = 0; x < BACKPACK_COLS; x++) {
      inventory.push({ itemId: smallItem, quantity: 1, chest: 0, x, y });
    }
  }
  const slot = findFreeSlotForItem(otherSmallItem, inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS);
  assert.ok(slot, "free slot found in another chest");
  assert.ok(slot.chest > 0, "slot is in chest 1+");
}

console.log(JSON.stringify({ ok: true, checked: "inventory-grid" }, null, 2));
