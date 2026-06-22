"use client";

import type React from "react";
import type { InventoryItem } from "@/lib/types";

export interface ChestGridMetrics {
  cols: number;
  rows: number;
  cellSize: number;
  gap: number;
  padding: number;
}

export const PLAYER_CHEST_GRID: ChestGridMetrics = {
  cols: 8,
  rows: 5,
  cellSize: 56,
  gap: 4,
  padding: 4,
};

export const VENDOR_CHEST_GRID: ChestGridMetrics = {
  cols: 8,
  rows: 4,
  cellSize: 40,
  gap: 4,
  padding: 4,
};

export function footprintPx(footprint: { cols: number; rows: number }, metrics: ChestGridMetrics, axis: "x" | "y") {
  const cells = axis === "x" ? footprint.cols : footprint.rows;
  return cells * metrics.cellSize + (cells - 1) * metrics.gap;
}

export function ItemChestGrid({
  metrics,
  inventory,
  renderItem,
  children,
  className = "",
  onCellDrop,
  onCellDragOver,
}: {
  metrics: ChestGridMetrics;
  inventory?: InventoryItem[];
  renderItem?: (item: InventoryItem, metrics: ChestGridMetrics) => React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onCellDrop?: (x: number, y: number, event: React.DragEvent) => void;
  onCellDragOver?: (event: React.DragEvent) => void;
}) {
  const width = metrics.cols * metrics.cellSize + (metrics.cols - 1) * metrics.gap + metrics.padding * 2;
  const height = metrics.rows * metrics.cellSize + (metrics.rows - 1) * metrics.gap + metrics.padding * 2;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xs border border-iron bg-stone-950/40 ${className}`}
      style={{
        boxSizing: "border-box",
        width,
        height,
        padding: metrics.padding,
        backgroundImage:
          "linear-gradient(to right, rgba(187, 163, 106, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(187, 163, 106, 0.1) 1px, transparent 1px)",
        backgroundSize: `${metrics.cellSize + metrics.gap}px ${metrics.cellSize + metrics.gap}px`,
      }}
    >
      {Array.from({ length: metrics.rows }).map((_, y) =>
        Array.from({ length: metrics.cols }).map((__, x) => (
          <div
            key={`cell-${x}-${y}`}
            onDragOver={onCellDragOver}
            onDrop={onCellDrop ? (event) => onCellDrop(x, y, event) : undefined}
            className="absolute"
            style={{
              left: metrics.padding + x * (metrics.cellSize + metrics.gap),
              top: metrics.padding + y * (metrics.cellSize + metrics.gap),
              width: metrics.cellSize,
              height: metrics.cellSize,
            }}
          />
        )),
      )}

      {inventory && renderItem
        ? inventory.map((invItem) => {
            if (invItem.x === undefined || invItem.y === undefined) return null;
            return (
              <div
                key={invItem.itemId}
                className="absolute"
                style={{
                  left: metrics.padding + invItem.x * (metrics.cellSize + metrics.gap),
                  top: metrics.padding + invItem.y * (metrics.cellSize + metrics.gap),
                }}
              >
                {renderItem(invItem, metrics)}
              </div>
            );
          })
        : (
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${metrics.cols}, ${metrics.cellSize}px)`,
                gridAutoRows: `${metrics.cellSize}px`,
                gridAutoFlow: "row dense",
                gap: metrics.gap,
              }}
            >
              {children}
            </div>
          )}
    </div>
  );
}
