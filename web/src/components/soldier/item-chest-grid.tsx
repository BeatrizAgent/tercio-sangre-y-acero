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

export interface ChestDropPreview {
  itemId: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
  valid: boolean;
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
  rows: 5,
  cellSize: 56,
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
  onCellDragLeave,
  dropPreview,
}: {
  metrics: ChestGridMetrics;
  inventory?: InventoryItem[];
  renderItem?: (item: InventoryItem, metrics: ChestGridMetrics) => React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onCellDrop?: (x: number, y: number, event: React.DragEvent) => void;
  onCellDragOver?: (x: number, y: number, event: React.DragEvent) => void;
  onCellDragLeave?: (event: React.DragEvent) => void;
  dropPreview?: ChestDropPreview | null;
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
        backgroundPosition: `${metrics.padding}px ${metrics.padding}px`,
      }}
    >
      {Array.from({ length: metrics.rows }).map((_, y) =>
        Array.from({ length: metrics.cols }).map((__, x) => (
          <div
            key={`cell-${x}-${y}`}
            onDragOver={onCellDragOver ? (event) => onCellDragOver(x, y, event) : undefined}
            onDragLeave={onCellDragLeave}
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

      {dropPreview && (
        <div
          className={`pointer-events-none absolute z-10 rounded-xs border-2 border-dashed transition-colors ${
            dropPreview.valid
              ? "border-emerald-300 bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
              : "border-red-300 bg-red-950/45 shadow-[0_0_10px_rgba(220,38,38,0.25)]"
          }`}
          style={{
            left: metrics.padding + dropPreview.x * (metrics.cellSize + metrics.gap),
            top: metrics.padding + dropPreview.y * (metrics.cellSize + metrics.gap),
            width: footprintPx(dropPreview, metrics, "x"),
            height: footprintPx(dropPreview, metrics, "y"),
          }}
          aria-hidden="true"
        />
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
