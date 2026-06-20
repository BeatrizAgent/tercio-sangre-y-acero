import type { InventoryItem } from "../types";
import { getItem, getItemFootprint } from "../game-data";

export const BACKPACK_COLS = 8;
export const BACKPACK_ROWS = 5;
export const BACKPACK_CHESTS = 3;

export interface InventoryPosition {
  chest: number;
  x: number;
  y: number;
}

interface OccupiedRect extends InventoryPosition {
  cols: number;
  rows: number;
}

export function getFootprintArea(itemId: string): number {
  const item = getItem(itemId);
  if (!item) return 0;
  const footprint = getItemFootprint(item);
  return footprint.cols * footprint.rows;
}

function normalizeChest(chest: number | undefined) {
  return Number.isInteger(chest) && chest !== undefined && chest >= 0 ? chest : 0;
}

function validChest(chest: number, maxChests: number) {
  return Number.isInteger(chest) && chest >= 0 && chest < maxChests;
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function rectForItem(item: InventoryItem): OccupiedRect | null {
  if (item.x === undefined || item.y === undefined) return null;
  const def = getItem(item.itemId);
  if (!def) return null;
  const footprint = getItemFootprint(def);
  return {
    chest: normalizeChest(item.chest),
    x: item.x,
    y: item.y,
    cols: footprint.cols,
    rows: footprint.rows,
  };
}

export function canPlaceItem(
  gridItems: InventoryItem[],
  itemId: string,
  x: number,
  y: number,
  cols: number = BACKPACK_COLS,
  rows: number = BACKPACK_ROWS,
  excludeItemId?: string,
  chest: number = 0,
): boolean {
  const item = getItem(itemId);
  if (!item) return false;
  const footprint = getItemFootprint(item);

  if (!Number.isInteger(chest) || chest < 0) return false;
  if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
  if (x < 0 || y < 0) return false;
  if (x + footprint.cols > cols) return false;
  if (y + footprint.rows > rows) return false;

  for (const other of gridItems) {
    if (excludeItemId && other.itemId === excludeItemId) continue;
    const rect = rectForItem(other);
    if (!rect || rect.chest !== chest) continue;
    if (rectsOverlap(x, y, footprint.cols, footprint.rows, rect.x, rect.y, rect.cols, rect.rows)) {
      return false;
    }
  }
  return true;
}

function findFirstFreeSlot(
  itemCols: number,
  itemRows: number,
  occupied: OccupiedRect[],
  maxCols: number,
  maxRows: number,
  maxChests: number,
): InventoryPosition | null {
  for (let chest = 0; chest < maxChests; chest++) {
    const chestOccupied = occupied.filter((rect) => rect.chest === chest);
    for (let y = 0; y <= maxRows - itemRows; y++) {
      for (let x = 0; x <= maxCols - itemCols; x++) {
        const collides = chestOccupied.some((rect) =>
          rectsOverlap(x, y, itemCols, itemRows, rect.x, rect.y, rect.cols, rect.rows),
        );
        if (!collides) return { chest, x, y };
      }
    }
  }
  return null;
}

export function autoPlaceItems(
  inventory: InventoryItem[],
  cols: number = BACKPACK_COLS,
  rows: number = BACKPACK_ROWS,
  chests: number = BACKPACK_CHESTS,
): InventoryItem[] {
  const placed: InventoryItem[] = [];
  const placedIndexes = new Set<number>();
  const occupied: OccupiedRect[] = [];

  for (const [index, item] of inventory.entries()) {
    const chest = normalizeChest(item.chest);
    if (item.x === undefined || item.y === undefined) continue;
    if (!validChest(chest, chests)) continue;
    if (canPlaceItem(placed, item.itemId, item.x, item.y, cols, rows, undefined, chest)) {
      const positioned = { ...item, chest };
      placed.push(positioned);
      placedIndexes.add(index);
      const rect = rectForItem(positioned);
      if (rect) occupied.push(rect);
    }
  }

  for (const [index, item] of inventory.entries()) {
    if (placedIndexes.has(index)) continue;
    const def = getItem(item.itemId);
    if (!def) {
      placed.push({ ...item, chest: normalizeChest(item.chest) });
      continue;
    }
    const footprint = getItemFootprint(def);
    const slot = findFirstFreeSlot(footprint.cols, footprint.rows, occupied, cols, rows, chests);
    if (slot) {
      const positioned: InventoryItem = { ...item, chest: slot.chest, x: slot.x, y: slot.y };
      placed.push(positioned);
      occupied.push({ ...slot, cols: footprint.cols, rows: footprint.rows });
    } else {
      placed.push({ ...item, chest: normalizeChest(item.chest) });
    }
  }

  return placed;
}

export function findFreeSlotForItem(
  itemId: string,
  inventory: InventoryItem[],
  cols: number = BACKPACK_COLS,
  rows: number = BACKPACK_ROWS,
  chests: number = BACKPACK_CHESTS,
): InventoryPosition | null {
  const def = getItem(itemId);
  if (!def) return null;
  const laidOut = autoPlaceItems(inventory, cols, rows, chests);
  const footprint = getItemFootprint(def);
  const occupied = laidOut.flatMap((item) => {
    const rect = rectForItem(item);
    return rect ? [rect] : [];
  });
  return findFirstFreeSlot(footprint.cols, footprint.rows, occupied, cols, rows, chests);
}

export function moveInventoryItem(
  inventory: InventoryItem[],
  itemId: string,
  x: number,
  y: number,
  cols: number = BACKPACK_COLS,
  rows: number = BACKPACK_ROWS,
  chest: number = 0,
): InventoryItem[] {
  const laidOut = autoPlaceItems(inventory, cols, rows);
  if (!canPlaceItem(laidOut, itemId, x, y, cols, rows, itemId, chest)) {
    return laidOut;
  }
  return laidOut.map((item) => (item.itemId === itemId ? { ...item, chest, x, y } : item));
}

export function addInventoryItem(
  inventory: InventoryItem[],
  itemId: string,
  quantity: number,
  cols: number = BACKPACK_COLS,
  rows: number = BACKPACK_ROWS,
  chests: number = BACKPACK_CHESTS,
): { ok: boolean; inventory: InventoryItem[] } {
  const laidOut = autoPlaceItems(inventory, cols, rows, chests);
  const ownedIdx = laidOut.findIndex((item) => item.itemId === itemId);
  if (ownedIdx > -1) {
    const next = [...laidOut];
    next[ownedIdx] = { ...next[ownedIdx], quantity: next[ownedIdx].quantity + quantity };
    return { ok: true, inventory: next };
  }
  const slot = findFreeSlotForItem(itemId, laidOut, cols, rows, chests);
  if (!slot) return { ok: false, inventory: laidOut };
  return { ok: true, inventory: [...laidOut, { itemId, quantity, ...slot }] };
}

export function inventoryWithAutoLayout(
  inventory: InventoryItem[],
  cols: number = BACKPACK_COLS,
  rows: number = BACKPACK_ROWS,
  chests: number = BACKPACK_CHESTS,
): InventoryItem[] {
  return autoPlaceItems(inventory, cols, rows, chests);
}
