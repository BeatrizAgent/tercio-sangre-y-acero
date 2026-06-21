"use client";

import React from "react";
import { Shield, Sparkles, Swords, X } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { getItem, getItemImagePath } from "@/lib/game-data";
import type { Equipment, EquipmentSlot } from "@/lib/types";

const SLOT_META: Array<{
  key: EquipmentSlot;
  label: string;
  row: number;
  col: number;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "head", label: "Cabeza", row: 0, col: 1, icon: Shield },
  { key: "accessory", label: "Reliquia", row: 0, col: 2, icon: Sparkles },
  { key: "mainHand", label: "Principal", row: 1, col: 0, icon: Swords },
  { key: "body", label: "Cuerpo", row: 1, col: 1, icon: Shield },
  { key: "offHand", label: "Secundaria", row: 1, col: 2, icon: Shield },
  { key: "firearm", label: "Fuego", row: 2, col: 0, icon: Swords },
  { key: "boots", label: "Calzado", row: 2, col: 1, icon: Shield },
  { key: "consumable", label: "Consumible", row: 2, col: 2, icon: Sparkles },
];

interface EquipmentMannequinProps {
  equipment: Equipment;
  draggingItemId: string | null;
  draggedOverSlot: EquipmentSlot | null;
  readOnly?: boolean;
  onDragOver: (slot: EquipmentSlot, event: React.DragEvent) => void;
  onDrop: (slot: EquipmentSlot, event: React.DragEvent) => void;
  onDragStart: (slot: EquipmentSlot, event: React.DragEvent) => void;
  onDragEnd: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onSelect: (itemId: string) => void;
}

export function EquipmentMannequin({
  equipment,
  draggingItemId,
  draggedOverSlot,
  readOnly = false,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onUnequip,
  onSelect,
}: EquipmentMannequinProps) {
  return (
    <section className="bg-panel border border-iron rounded-xs p-3 shadow-md">
      <div className="flex justify-between items-center mb-2 border-b border-iron/40 pb-1">
        <span className="flex items-center gap-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-gold-soft/80">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-gold/70" />
          Maniqui
        </span>
        <span className="text-[9px] font-mono italic text-text-muted">
          {readOnly ? "equipo asignado" : "arrastra para equipar"}
        </span>
      </div>
      <div className="relative mx-auto h-[264px] w-[264px] rounded-xs border border-iron bg-stone-900/30 p-3 sm:h-[280px] sm:w-[280px]">
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gridTemplateRows: "repeat(3, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => {
              const meta = SLOT_META.find((slot) => slot.row === row && slot.col === col);
              if (!meta) {
                return (
                  <div
                    key={`empty-${row}-${col}`}
                    className="flex items-center justify-center rounded-xs border border-iron/30 bg-background/20 opacity-30"
                  >
                    <Shield className="h-5 w-5 text-muted" />
                  </div>
                );
              }

              return (
                <MannequinSlot
                  key={meta.key}
                  slot={meta.key}
                  label={meta.label}
                  equippedItemId={equipment[meta.key]}
                  draggingItemId={readOnly ? null : draggingItemId}
                  draggedOverSlot={draggedOverSlot}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onUnequip={onUnequip}
                  onSelect={onSelect}
                  readOnly={readOnly}
                />
              );
            }),
          )}
        </div>
      </div>
    </section>
  );
}

function MannequinSlot({
  slot,
  label,
  equippedItemId,
  draggingItemId,
  draggedOverSlot,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onUnequip,
  onSelect,
  readOnly,
}: {
  slot: EquipmentSlot;
  label: string;
  equippedItemId: string | null;
  draggingItemId: string | null;
  draggedOverSlot: EquipmentSlot | null;
  onDragOver: (slot: EquipmentSlot, event: React.DragEvent) => void;
  onDrop: (slot: EquipmentSlot, event: React.DragEvent) => void;
  onDragStart: (slot: EquipmentSlot, event: React.DragEvent) => void;
  onDragEnd: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onSelect: (itemId: string) => void;
  readOnly: boolean;
}) {
  const item = equippedItemId ? getItem(equippedItemId) : null;
  const isValidDrop = !readOnly && draggingItemId ? getItem(draggingItemId)?.slot === slot : false;
  const isHovering = draggedOverSlot === slot;
  const ringClass = isHovering
    ? "ring-2 ring-gold border-gold bg-gold/15"
    : isValidDrop
      ? "border-gold-soft border-dashed bg-gold-soft/5"
      : "border-iron/60";

  return (
    <div
      className="flex flex-col items-center"
      onDragOver={(event) => {
        if (!readOnly) onDragOver(slot, event);
      }}
      onDrop={(event) => {
        if (!readOnly) onDrop(slot, event);
      }}
    >
      <div className={`equipment-slot flex h-[64px] w-[64px] items-center justify-center rounded-xs border bg-background/30 transition-all sm:h-[68px] sm:w-[68px] ${ringClass}`}>
        {item ? (
          <Tooltip type="item" itemId={item.id} fill>
            <button
              draggable={!readOnly}
              onDragStart={(event) => onDragStart(slot, event)}
              onDragEnd={onDragEnd}
              onDoubleClick={() => {
                if (!readOnly) onUnequip(slot);
              }}
              onClick={() => onSelect(item.id)}
              className="group relative flex h-full w-full cursor-pointer items-center justify-center p-0.5"
            >
              <img
                src={getItemImagePath(item.id)}
                alt={item.name}
                className="h-full w-full object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              {!readOnly && (
                <span className="absolute right-0.5 top-0.5 rounded-xs border border-iron/40 bg-background/90 px-0.5 text-[8px] font-bold leading-none text-danger opacity-0 group-hover:opacity-100">
                  <X className="h-2 w-2" />
                </span>
              )}
            </button>
          </Tooltip>
        ) : (
          <span className="font-mono text-[9px] uppercase text-muted/40">{label.slice(0, 3)}</span>
        )}
      </div>
      <span className="mt-0.5 font-mono text-[8px] uppercase leading-none text-text-muted">
        {label}
      </span>
    </div>
  );
}
