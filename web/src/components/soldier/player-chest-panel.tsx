"use client";

import type React from "react";
import { InventoryChest } from "@/components/soldier/inventory-chest";
import { ProfileRoleTabs, type ProfileRoleTab } from "@/components/soldier/profile-role-tabs";
import type { Equipment, InventoryItem } from "@/lib/types";

interface PlayerChestPanelProps {
  profiles?: ProfileRoleTab[];
  activeProfileId?: string;
  onProfileSelect?: (profileId: string) => void;
  items: InventoryItem[];
  equipment: Equipment;
  activeChest: number;
  activeChestCells: number;
  selectedItemId: string | null;
  draggingItemId: string | null;
  isOverBackpack: boolean;
  readOnly?: boolean;
  title?: string;
  onChestChange: (chest: number) => void;
  onSelectItem: (itemId: string) => void;
  onDragStart: (itemId: string, event: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOverBackpack: (event: React.DragEvent) => void;
  onDragLeaveBackpack: () => void;
  onDropBackpack: (event: React.DragEvent) => void;
  onCellDrop: (x: number, y: number, event: React.DragEvent) => void;
}

export function PlayerChestPanel({
  profiles,
  activeProfileId,
  onProfileSelect,
  title = "Baul del jugador",
  ...chestProps
}: PlayerChestPanelProps) {
  return (
    <section className="game-panel min-w-0 w-full max-w-full overflow-hidden space-y-2 p-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-iron/45 pb-2">
        <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.16em] text-gold">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">personajes + baul</span>
      </div>
      {profiles && activeProfileId && onProfileSelect && (
        <ProfileRoleTabs profiles={profiles} activeProfileId={activeProfileId} onSelect={onProfileSelect} compact />
      )}
      <InventoryChest {...chestProps} />
    </section>
  );
}
