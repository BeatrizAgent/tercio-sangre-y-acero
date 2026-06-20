"use client";

import React from "react";
import { Backpack } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { getItem, getItemFootprint, getItemImagePath } from "@/lib/game-data";
import { ItemChestGrid, PLAYER_CHEST_GRID, footprintPx } from "@/components/soldier/item-chest-grid";
import {
  BACKPACK_CHESTS,
  BACKPACK_COLS,
  BACKPACK_ROWS,
} from "@/lib/inventory-grid";
import type { Equipment, InventoryItem } from "@/lib/types";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

interface InventoryChestProps {
  items: InventoryItem[];
  equipment: Equipment;
  activeChest: number;
  activeChestCells: number;
  selectedItemId: string | null;
  draggingItemId: string | null;
  isOverBackpack: boolean;
  readOnly?: boolean;
  onChestChange: (chest: number) => void;
  onSelectItem: (itemId: string) => void;
  onDragStart: (itemId: string, event: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOverBackpack: (event: React.DragEvent) => void;
  onDragLeaveBackpack: () => void;
  onDropBackpack: (event: React.DragEvent) => void;
  onCellDrop: (x: number, y: number, event: React.DragEvent) => void;
}

export function InventoryChest({
  items,
  equipment,
  activeChest,
  activeChestCells,
  selectedItemId,
  draggingItemId,
  isOverBackpack,
  readOnly = false,
  onChestChange,
  onSelectItem,
  onDragStart,
  onDragEnd,
  onDragOverBackpack,
  onDragLeaveBackpack,
  onDropBackpack,
  onCellDrop,
}: InventoryChestProps) {
  const capacity = BACKPACK_COLS * BACKPACK_ROWS;

  return (
    <section
      onDragOver={readOnly ? undefined : onDragOverBackpack}
      onDragLeave={readOnly ? undefined : onDragLeaveBackpack}
      onDrop={readOnly ? undefined : onDropBackpack}
      className={`bg-panel border border-iron rounded-xs p-3 shadow-md transition-all ${
        isOverBackpack ? "ring-2 ring-gold/40" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-2 border-b border-iron/40 pb-1">
        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-gold-soft/80 flex items-center gap-1.5">
          <Backpack className="w-3.5 h-3.5" />
          Mochila
        </span>
        <span className="text-[9px] font-mono text-text-muted">
          Baul {activeChest + 1}: {activeChestCells}/{capacity}
        </span>
      </div>

      <div className="flex gap-1 mb-2">
        {Array.from({ length: BACKPACK_CHESTS }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onChestChange(idx)}
            className={`h-7 min-w-10 rounded-xs border px-2 font-mono text-[10px] font-bold uppercase transition ${
              activeChest === idx
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-iron/60 text-text-muted hover:border-gold/30 hover:text-gold"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div
        className="grid mb-1 text-center text-[9px] font-mono text-text-muted"
        style={{
          gridTemplateColumns: `repeat(${BACKPACK_COLS}, 1fr)`,
          gap: PLAYER_CHEST_GRID.gap,
          paddingLeft: 4,
          paddingRight: 4,
        }}
      >
        {ROMAN.slice(0, BACKPACK_COLS).map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>

      <div className="flex justify-center overflow-x-auto pb-1">
        <ItemChestGrid
          metrics={PLAYER_CHEST_GRID}
          inventory={items.filter((entry) => (entry.chest ?? 0) === activeChest)}
          onCellDragOver={
            readOnly
              ? undefined
              : (event) => {
                  event.preventDefault();
                  onDragOverBackpack(event);
                }
          }
          onCellDrop={readOnly ? undefined : onCellDrop}
          renderItem={(invItem, metrics) => {
              if (invItem.x === undefined || invItem.y === undefined) return null;
              const item = getItem(invItem.itemId);
              if (!item) return null;
              const footprint = getItemFootprint(item);
              const isSelected = selectedItemId === invItem.itemId;
              const isEquipped = Object.values(equipment).includes(invItem.itemId);
              const isEquipable = item.slot !== "consumable";

              return (
                <div
                  key={invItem.itemId}
                  style={{
                    width: footprintPx(footprint, metrics, "x"),
                    height: footprintPx(footprint, metrics, "y"),
                  }}
                >
                  <Tooltip type="item" itemId={invItem.itemId}>
                    <button
                      onClick={() => onSelectItem(invItem.itemId)}
                      draggable={!readOnly && isEquipable}
                      onDragStart={(event) => onDragStart(invItem.itemId, event)}
                      onDragEnd={onDragEnd}
                      className={`relative flex h-full w-full cursor-pointer items-center justify-center rounded-xs border bg-stone-950/40 p-1 transition-all hover:bg-stone-950/70 ${
                        isSelected
                          ? "border-gold bg-panel-raised shadow-[0_0_6px_rgba(201,162,79,0.4)]"
                          : "border-iron/40 hover:border-gold/40"
                      } ${draggingItemId === invItem.itemId ? "opacity-30 border-dashed" : ""}`}
                      title={item.name}
                    >
                      <img
                        src={getItemImagePath(invItem.itemId)}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        draggable={false}
                      />
                      {invItem.quantity > 1 && (
                        <span className="absolute bottom-0.5 right-0.5 rounded-xs border border-iron/40 bg-black/90 px-0.5 font-mono text-[8px] font-bold leading-none text-white">
                          {invItem.quantity}
                        </span>
                      )}
                      {isEquipped && (
                        <span className="absolute left-0.5 top-0.5 h-1.5 w-1.5 rounded-full border border-stone-950 bg-gold" />
                      )}
                    </button>
                  </Tooltip>
                </div>
              );
            }}
        />
      </div>
    </section>
  );
}
