"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import {
  BACKPACK_COLS,
  BACKPACK_CHESTS,
  BACKPACK_ROWS,
  inventoryWithAutoLayout,
} from "@/lib/inventory-grid";
import {
  getEquipmentBonuses,
  getItem,
  getItemFootprint,
  getItemImagePath,
  rankDefinitions,
} from "@/lib/game-data";
import { playPageSound, playSwordSound, playCoinSound } from "@/lib/sounds";
import { PageTransition } from "@/components/game/page-transition";
import { CharacterSpritePreview } from "@/components/soldier/character-sprite-preview";
import { Tooltip } from "@/components/ui/tooltip";
import { passiveShortLine, rarityStyle, TRIGGER_LABEL } from "@/lib/item-format";
import { FORMATION_META } from "@/lib/formation";
import {
  Shield,
  Sparkles,
  Swords,
  Backpack,
  X,
} from "lucide-react";
import type { CharacterState, Equipment, EquipmentSlot, FormationSlot, Passive, Stats, StatId } from "@/lib/types";

const BACKPACK_CELL_SIZE = 56;
const BACKPACK_GAP = 4;
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

type Tab = "vision_general" | "estadisticas" | "logros" | "familia";

const STAT_ORDER: StatId[] = ["pike", "sword", "arquebus", "discipline", "vigor", "cunning", "command"];

const STAT_LABELS: Record<StatId, string> = {
  pike: "Pica",
  sword: "Espada",
  arquebus: "Arcabuz",
  discipline: "Disciplina",
  vigor: "Vigor",
  cunning: "Astucia",
  command: "Mando",
};

type ProfilePreset = {
  id: string;
  name: string;
  role: string;
  rank: string;
  portraitAssetId: string;
  spriteSetId?: string;
  formationSlot: FormationSlot;
  stats: Stats;
  equipment: Equipment;
  icon: React.ComponentType<{ className?: string }>;
};

function profileFromCharacter(character: CharacterState, soldier: { name: string; rank: string; stats: Stats; equipment: Equipment; fatigue: number }): ProfilePreset {
  const isPlayer = character.id === "diego_de_arce";
  return {
    id: character.id,
    name: isPlayer ? soldier.name : character.name,
    role: character.role,
    rank: isPlayer ? soldier.rank : character.rank,
    portraitAssetId: character.portraitAssetId,
    spriteSetId: character.spriteSetId,
    formationSlot: character.formationSlot,
    stats: isPlayer ? soldier.stats : character.stats,
    equipment: isPlayer ? soldier.equipment : character.equipment,
    icon: FORMATION_META[character.formationSlot].Icon,
  };
}

const SLOT_META: Array<{
  key: EquipmentSlot;
  label: string;
  row: number;
  col: number;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
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

function footprintPx(footprint: { cols: number; rows: number }, axis: "x" | "y") {
  const cells = axis === "x" ? footprint.cols : footprint.rows;
  return cells * BACKPACK_CELL_SIZE + (cells - 1) * BACKPACK_GAP;
}

export default function SoldierPage() {
  const {
    soldier,
    characters,
    activeCharacterId,
    reports,
    arenaResults,
    equipItem,
    unequipItem,
    sellItem,
    moveInventoryItem,
    setActiveCharacter,
  } = useGameStore();
  const [activeTab, setActiveTab] = useState<Tab>("vision_general");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeChest, setActiveChest] = useState(0);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<EquipmentSlot | null>(null);
  const [draggedOverSlot, setDraggedOverSlot] = useState<EquipmentSlot | null>(null);
  const [isOverBackpack, setIsOverBackpack] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (soldier.inventory.length > 0 && !selectedItemId) {
        setSelectedItemId(soldier.inventory[0].itemId);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [soldier.inventory, selectedItemId]);

  const profilePresets = useMemo<ProfilePreset[]>(
    () => characters.map((character) => profileFromCharacter(character, soldier)),
    [characters, soldier],
  );
  const activeProfile = profilePresets.find((profile) => profile.id === activeCharacterId) ?? profilePresets[0];
  const isPlayerProfile = activeProfile.id === "diego_de_arce";
  const activeEquipment = activeProfile.equipment;
  const activeStats = activeProfile.stats;
  const equipmentBonuses = getEquipmentBonuses(activeEquipment);
  const laidOutInventory = useMemo(
    () => inventoryWithAutoLayout(soldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS),
    [soldier.inventory],
  );

  const currentRankIdx = rankDefinitions.findIndex((r) => r.id === activeProfile.rank);
  const currentRank = currentRankIdx >= 0 ? rankDefinitions[currentRankIdx] : null;
  const nextRank = currentRankIdx >= 0 && currentRankIdx < rankDefinitions.length - 1
    ? rankDefinitions[currentRankIdx + 1]
    : null;
  const xpProgress = currentRank && nextRank && isPlayerProfile
    ? Math.min(100, Math.max(0, ((soldier.xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100))
    : isPlayerProfile ? 100 : 68 + Math.min(20, activeStats.vigor * 4);
  const lifeRatio = isPlayerProfile ? Math.max(0, 100 - soldier.fatigue) : 75 + Math.min(20, activeStats.discipline * 3);

  const armor = 10 +
    (activeStats.discipline + activeStats.vigor) * 5 +
    (equipmentBonuses.discipline ?? 0) * 8 +
    (equipmentBonuses.vigor ?? 0) * 8 +
    (activeEquipment.body ? 15 : 0) +
    (activeEquipment.head ? 10 : 0) +
    (activeEquipment.offHand ? 12 : 0) +
    (activeEquipment.boots ? 8 : 0);
  const minDmg = Math.max(1, activeStats.sword + (equipmentBonuses.sword ?? 0));
  const maxDmg = Math.max(minDmg + 1, activeStats.pike * 2 + (equipmentBonuses.pike ?? 0) * 2);
  const damageStr = `${minDmg} - ${maxDmg}`;

  const carryCapacity = BACKPACK_COLS * BACKPACK_ROWS;
  const activeChestCells = laidOutInventory
    .filter((entry) => (entry.chest ?? 0) === activeChest)
    .reduce((sum, invItem) => {
      const item = getItem(invItem.itemId);
      const footprint = getItemFootprint(item);
      return sum + footprint.cols * footprint.rows;
    }, 0);

  const showNotification = (msg: string) => {
    setNotification(msg);
    window.setTimeout(() => setNotification(null), 2400);
  };

  const handleEquip = (itemId: string) => {
    const res = equipItem(itemId);
    if (res.ok) playSwordSound();
    showNotification(res.message);
  };

  const handleUnequip = (slot: EquipmentSlot) => {
    const res = unequipItem(slot);
    if (res.ok) playSwordSound();
    showNotification(res.message);
  };

  const handleSell = (itemId: string) => {
    const res = sellItem(itemId);
    if (res.ok) playCoinSound();
    showNotification(res.message);
  };

  const handleDragStart = (itemId: string, e: React.DragEvent) => {
    setDraggingItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragStartSlot = (slot: EquipmentSlot, e: React.DragEvent) => {
    setDraggingSlot(slot);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `slot:${slot}`);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDraggingSlot(null);
    setDraggedOverSlot(null);
    setIsOverBackpack(false);
  };

  const handleDragOverSlot = (slot: EquipmentSlot, e: React.DragEvent) => {
    if (draggingItemId) {
      const item = getItem(draggingItemId);
      if (item?.slot === slot) {
        e.preventDefault();
        setDraggedOverSlot(slot);
      }
    } else if (draggingSlot) {
      e.preventDefault();
      setDraggedOverSlot(slot);
    }
  };

  const handleDropOnSlot = (slot: EquipmentSlot, e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data.startsWith("slot:")) return;
    if (data) handleEquip(data);
    setDraggedOverSlot(null);
  };

  const handleDropOnBackpack = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data.startsWith("slot:")) {
      const slot = data.split(":")[1] as EquipmentSlot;
      handleUnequip(slot);
    }
    setDraggingSlot(null);
    setIsOverBackpack(false);
  };

  const handleCellDrop = (x: number, y: number, e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data.startsWith("slot:")) {
      const slot = data.split(":")[1] as EquipmentSlot;
      handleUnequip(slot);
      setDraggingSlot(null);
      return;
    }
    if (draggingItemId) {
      const res = moveInventoryItem(draggingItemId, x, y, activeChest);
      if (!res.ok) showNotification(res.message);
    }
    setDraggingItemId(null);
    setIsOverBackpack(false);
  };

  const selectedItemDef = selectedItemId ? getItem(selectedItemId) : null;
  const selectedInvQuantity = selectedItemId
    ? soldier.inventory.find((i) => i.itemId === selectedItemId)?.quantity ?? 0
    : 0;
  const isSelectedEquipped = selectedItemDef
    ? Object.values(activeEquipment).includes(selectedItemDef.id)
    : false;

  return (
    <PageTransition>
      <div className="space-y-3">
        {/* Notification */}
        {notification && (
          <div className="px-3 py-1.5 bg-success/15 border border-success/40 text-success text-[11px] font-mono rounded-xs">
            {notification}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border border-iron/70 bg-panel-soft/20 rounded-xs overflow-hidden">
          {([
            { key: "vision_general" as const, label: "Vision general" },
            { key: "estadisticas" as const, label: "Estadisticas" },
            { key: "logros" as const, label: "Logros" },
            { key: "familia" as const, label: "Familia" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => { playPageSound(); setActiveTab(t.key); }}
              className={`flex-1 py-1.5 text-[11px] font-sans uppercase tracking-wider transition-all border-r border-iron/60 last:border-r-0 ${
                activeTab === t.key
                  ? "bg-blood/15 text-gold font-bold"
                  : "text-text-muted hover:text-text hover:bg-panel-soft/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: VISION GENERAL */}
        {activeTab === "vision_general" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* LEFT: Portrait + Stats */}
            <div className="lg:col-span-4 space-y-3">
              {/* Name banner */}
              <div className="bg-blood border border-blood-bright/40 py-1.5 px-3 rounded-xs text-center shadow-md">
                <h2 className="font-cinzel text-base font-bold text-white tracking-widest">
                  {activeProfile.name}
                </h2>
                <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-gold-soft">
                  {activeProfile.role}
                </p>
              </div>

              {/* Sprite / portrait */}
              <div className="bg-panel border border-iron rounded-xs p-2 shadow-md">
                <div className="w-full aspect-[3/4] overflow-hidden border border-iron rounded-xs bg-stone-950/40 relative">
                  <CharacterSpritePreview
                    spriteSetId={activeProfile.spriteSetId}
                    fallbackAssetId={activeProfile.portraitAssetId}
                    label={activeProfile.name}
                  />
                  <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                    {profilePresets.map((profile) => {
                      const Icon = profile.icon;
                      const isActive = activeProfile.id === profile.id;
                      return (
                        <button
                          key={profile.id}
                          onClick={() => {
                            playPageSound();
                            setActiveCharacter(profile.id);
                            setDraggedOverSlot(null);
                            setDraggingItemId(null);
                            setDraggingSlot(null);
                          }}
                          className={`h-9 w-9 border rounded-xs flex items-center justify-center shadow-md transition-all ${
                            isActive
                              ? "border-gold bg-gold/20 text-gold"
                              : "border-iron/70 bg-stone-950/80 text-text-muted hover:text-gold hover:border-gold/50"
                          }`}
                          aria-label={`Ver perfil de ${profile.name}`}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-mono uppercase tracking-wider">
                  <div className="border border-iron/60 bg-stone-900/50 px-2 py-1 rounded-xs text-text-muted">
                    Rango <span className="float-right text-gold">{activeProfile.rank}</span>
                  </div>
                  <div className="border border-iron/60 bg-stone-900/50 px-2 py-1 rounded-xs text-text-muted">
                    Rol <span className="float-right text-gold">{activeProfile.role}</span>
                  </div>
                  <div className="col-span-2 border border-iron/60 bg-stone-900/50 px-2 py-1 rounded-xs text-text-muted">
                    Formacion <span className="float-right text-gold">{FORMATION_META[activeProfile.formationSlot].label}</span>
                  </div>
                </div>
              </div>

              {/* Stats list */}
              <div className="bg-panel border border-iron rounded-xs p-2.5 shadow-md space-y-1 text-[11px] font-mono">
                <StatLine label="Nivel" value={currentRankIdx + 1} />
                <StatBar
                  label="Puntos de vida"
                  value={`${lifeRatio}%`}
                  ratio={lifeRatio}
                  barClass="bg-red-600"
                />
                <StatBar
                  label="Experiencia"
                  value={`${xpProgress.toFixed(2)}%`}
                  ratio={xpProgress}
                  barClass="bg-amber-500"
                />
                {STAT_ORDER.map((stat) => {
                  const base = activeStats[stat];
                  const bonus = equipmentBonuses[stat] ?? 0;
                  return (
                    <StatLine
                      key={stat}
                      label={STAT_LABELS[stat]}
                      value={base + bonus}
                      bonus={bonus}
                    />
                  );
                })}
                <div className="border-t border-iron/40 pt-1 mt-1 space-y-1">
                  <StatLine label="Armadura" value={armor} />
                  <StatLine label="Dano" value={damageStr} />
                </div>
              </div>
            </div>

            {/* RIGHT: Mannequin + Backpack */}
            <div className="lg:col-span-8 space-y-3">
              <div className="bg-panel border border-iron rounded-xs p-3 shadow-md">
                <div className="mb-2 flex items-center justify-between border-b border-iron/40 pb-1">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-gold-soft/80">
                    Formacion
                  </span>
                  <span className="text-[9px] font-mono text-text-muted">{activeProfile.name}</span>
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  {(Object.keys(FORMATION_META) as FormationSlot[]).map((slot) => {
                    const assigned = characters.filter((character) => character.formationSlot === slot);
                    const isActiveSlot = activeProfile.formationSlot === slot;
                    return (
                      <div
                        key={slot}
                        className={`min-h-20 rounded-xs border p-2 text-left transition-all ${
                          isActiveSlot
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-iron bg-stone-950/45 text-text-muted"
                        }`}
                      >
                        <span className="block font-mono text-[10px] font-bold uppercase tracking-wider">
                          {FORMATION_META[slot].label}
                        </span>
                        <span className="mt-2 block text-[10px] leading-snug text-text-muted">
                          {assigned.length ? assigned.map((character) => character.name.split(" ")[0]).join(", ") : "Sin hombres"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <a
                  href="/company"
                  className="mt-2 inline-flex rounded-xs border border-gold/45 bg-gold/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gold transition-colors hover:bg-gold/15"
                >
                  Elegir formacion tipada
                </a>
              </div>

              {/* Mannequin */}
              <div className="bg-panel border border-iron rounded-xs p-3 shadow-md">
                <div className="flex justify-between items-center mb-2 border-b border-iron/40 pb-1">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-gold-soft/80">
                    Maniqui
                  </span>
                  <span className="text-[9px] font-mono italic text-text-muted">
                    {isPlayerProfile ? "arrastra para equipar" : "equipo asignado"}
                  </span>
                </div>
                <div
                  className="relative mx-auto p-3 bg-stone-900/30 border border-iron rounded-xs"
                  style={{ width: 280, height: 280 }}
                >
                  <div
                    className="grid h-full w-full"
                    style={{
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gridTemplateRows: "repeat(3, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {[0, 1, 2].map((row) =>
                      [0, 1, 2].map((col) => {
                        const meta = SLOT_META.find((m) => m.row === row && m.col === col);
                        if (!meta) {
                          return (
                            <div
                              key={`empty-${row}-${col}`}
                              className="border border-iron/30 bg-background/20 rounded-xs flex items-center justify-center opacity-30"
                            >
                              <Shield className="w-5 h-5 text-muted" />
                            </div>
                          );
                        }
                        return (
                          <MannequinSlot
                            key={meta.key}
                            slot={meta.key}
                            label={meta.label}
                            equippedItemId={activeEquipment[meta.key]}
                            draggingItemId={isPlayerProfile ? draggingItemId : null}
                            draggedOverSlot={draggedOverSlot}
                            onDragOver={handleDragOverSlot}
                            onDrop={handleDropOnSlot}
                            onDragStart={handleDragStartSlot}
                            onDragEnd={handleDragEnd}
                            onUnequip={handleUnequip}
                            onSelect={(id) => { playPageSound(); setSelectedItemId(id); }}
                            readOnly={!isPlayerProfile}
                          />
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>

              {/* Backpack */}
              <div
                onDragOver={(e) => { if (isPlayerProfile && (draggingItemId || draggingSlot)) { e.preventDefault(); setIsOverBackpack(true); } }}
                onDragLeave={() => setIsOverBackpack(false)}
                onDrop={isPlayerProfile ? handleDropOnBackpack : undefined}
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
                      Baul {activeChest + 1}: {activeChestCells}/{carryCapacity}
                    </span>
                  </div>

                {/* Chest selector */}
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: BACKPACK_CHESTS }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { playPageSound(); setActiveChest(idx); }}
                      className={`px-2 py-0.5 text-[10px] font-mono uppercase border rounded-xs ${
                        activeChest === idx
                          ? "border-gold/60 bg-gold/10 text-gold"
                          : "border-iron/60 text-text-muted hover:border-gold/30"
                      }`}
                    >
                      Baul {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Roman column headers */}
                <div
                  className="grid mb-1 text-center text-[9px] font-mono text-text-muted"
                  style={{
                    gridTemplateColumns: `repeat(${BACKPACK_COLS}, 1fr)`,
                    gap: BACKPACK_GAP,
                    paddingLeft: 4,
                    paddingRight: 4,
                  }}
                >
                  {ROMAN.slice(0, BACKPACK_COLS).map((r) => (
                    <span key={r}>{r}</span>
                  ))}
                </div>

                {/* 8x5 Grid */}
                <div className="flex justify-center">
                  <div
                    className="relative bg-stone-950/40 border border-iron rounded-xs"
                    style={{
                      width: BACKPACK_COLS * BACKPACK_CELL_SIZE + (BACKPACK_COLS - 1) * BACKPACK_GAP + 8,
                      height: BACKPACK_ROWS * BACKPACK_CELL_SIZE + (BACKPACK_ROWS - 1) * BACKPACK_GAP + 8,
                      padding: 4,
                      backgroundImage:
                        "linear-gradient(to right, rgba(187, 163, 106, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(187, 163, 106, 0.08) 1px, transparent 1px)",
                      backgroundSize: `${BACKPACK_CELL_SIZE + BACKPACK_GAP}px ${BACKPACK_CELL_SIZE + BACKPACK_GAP}px`,
                    }}
                  >
                    {Array.from({ length: BACKPACK_ROWS }).map((_, y) =>
                      Array.from({ length: BACKPACK_COLS }).map((__, x) => (
                        <div
                          key={`cell-${x}-${y}`}
                          onDragOver={(e) => { e.preventDefault(); setIsOverBackpack(true); }}
                          onDrop={(e) => handleCellDrop(x, y, e)}
                          className="absolute"
                          style={{
                            left: 4 + x * (BACKPACK_CELL_SIZE + BACKPACK_GAP),
                            top: 4 + y * (BACKPACK_CELL_SIZE + BACKPACK_GAP),
                            width: BACKPACK_CELL_SIZE,
                            height: BACKPACK_CELL_SIZE,
                          }}
                        />
                      )),
                    )}

                    {laidOutInventory
                      .filter((entry) => (entry.chest ?? 0) === activeChest)
                      .map((invItem) => {
                        if (invItem.x === undefined || invItem.y === undefined) return null;
                        const item = getItem(invItem.itemId);
                        if (!item) return null;
                        const footprint = getItemFootprint(item);
                        const isSelected = selectedItemId === invItem.itemId;
                        const isEquipped = Object.values(soldier.equipment).includes(invItem.itemId);
                        const isEquipable = item.slot !== "consumable";
                        return (
                          <div
                            key={invItem.itemId}
                            className="absolute"
                            style={{
                              left: 4 + invItem.x * (BACKPACK_CELL_SIZE + BACKPACK_GAP),
                              top: 4 + invItem.y * (BACKPACK_CELL_SIZE + BACKPACK_GAP),
                              width: footprintPx(footprint, "x"),
                              height: footprintPx(footprint, "y"),
                            }}
                          >
                            <Tooltip type="item" itemId={invItem.itemId}>
                              <button
                                onClick={() => { playPageSound(); setSelectedItemId(invItem.itemId); }}
                                draggable={isEquipable}
                                onDragStart={(e) => handleDragStart(invItem.itemId, e)}
                                onDragEnd={handleDragEnd}
                                className={`h-full w-full bg-stone-950/40 hover:bg-stone-950/70 border rounded-xs flex items-center justify-center p-1 relative cursor-pointer transition-all ${
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
                                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                                  draggable={false}
                                />
                                {invItem.quantity > 1 && (
                                  <span className="absolute bottom-0.5 right-0.5 bg-black/90 border border-iron/40 text-white font-mono text-[8px] px-0.5 rounded-xs font-bold leading-none">
                                    {invItem.quantity}
                                  </span>
                                )}
                                {isEquipped && (
                                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-gold border border-stone-950" />
                                )}
                              </button>
                            </Tooltip>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Item details */}
              {selectedItemDef && (
                <div className="bg-panel border border-iron rounded-xs p-3 shadow-md space-y-2">
                  <div className="flex items-center gap-3 pb-2 border-b border-iron">
                    <div className="w-12 h-12 border border-iron bg-stone-950 p-1 flex items-center justify-center rounded-xs shrink-0">
                      <img
                        src={getItemImagePath(selectedItemDef.id)}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-cinzel text-sm font-bold text-gold truncate">
                          {selectedItemDef.name}
                        </h3>
                        {selectedItemDef.rarity && selectedItemDef.rarity !== "common" && (
                          <span className={`text-[8px] font-mono font-bold uppercase tracking-wider border px-1 rounded-xs ${rarityStyle(selectedItemDef.rarity).ring} ${rarityStyle(selectedItemDef.rarity).color} ${rarityStyle(selectedItemDef.rarity).bg}`}>
                            {rarityStyle(selectedItemDef.rarity).label}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-text-muted">
                          x{selectedInvQuantity}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted italic mt-0.5">
                        {selectedItemDef.description}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {!isPlayerProfile ? (
                        <span className="px-3 py-1 border border-iron text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted rounded-xs">
                          {isSelectedEquipped ? "Asignado" : "Mochila comun"}
                        </span>
                      ) : selectedItemDef.slot !== "consumable" ? (
                        isSelectedEquipped ? (
                          <button
                            onClick={() => {
                              const slot = Object.keys(soldier.equipment).find(
                                (k) => soldier.equipment[k as EquipmentSlot] === selectedItemDef.id,
                              );
                              if (slot) handleUnequip(slot as EquipmentSlot);
                            }}
                            className="px-3 py-1 bg-stone-850 hover:bg-stone-800 border border-iron text-[10px] font-mono font-bold uppercase tracking-wider text-text rounded-xs transition-all"
                          >
                            Desequipar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(selectedItemDef.id)}
                            className="px-3 py-1 bg-blood hover:bg-blood-bright border border-blood-bright text-[10px] font-mono font-bold uppercase tracking-wider text-text hover:text-white rounded-xs transition-all"
                          >
                            Equipar
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleSell(selectedItemDef.id)}
                          className="px-3 py-1 bg-stone-850 hover:bg-stone-800 border border-iron text-[10px] font-mono font-bold uppercase tracking-wider text-gold rounded-xs transition-all"
                        >
                          Vender ({selectedItemDef.value} dob)
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedItemDef.passives && selectedItemDef.passives.length > 0 && (
                    <div className={`p-2 border rounded-xs space-y-1 ${rarityStyle(selectedItemDef.rarity).bg} ${rarityStyle(selectedItemDef.rarity).ring}`}>
                      {selectedItemDef.passives.map((p: Passive) => (
                        <div key={p.id} className="text-[10px] font-sans leading-snug">
                          <span className={`font-bold ${rarityStyle(selectedItemDef.rarity).color}`}>
                            {p.name}
                          </span>
                          <span className="text-text-muted text-[9px] font-mono uppercase ml-1.5">
                            [{TRIGGER_LABEL[p.trigger]}]
                          </span>
                          <div className="text-text-muted italic">{passiveShortLine(p)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: ESTADISTICAS */}
        {activeTab === "estadisticas" && (
          <div className="bg-panel border border-iron rounded-xs p-4 shadow-md">
            <div className="text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-gold-soft/80 mb-3 border-b border-iron/40 pb-1">
              Estadisticas detalladas
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
              {STAT_ORDER.map((stat) => {
                const base = activeStats[stat];
                const bonus = equipmentBonuses[stat] ?? 0;
                return (
                  <div key={stat} className="bg-stone-900/30 border border-iron p-2 rounded-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-text-muted uppercase tracking-wider text-[10px]">
                        {STAT_LABELS[stat]}
                      </span>
                      <span className="text-gold font-bold">
                        {base + bonus}
                        {bonus > 0 && <span className="text-success text-[9px] ml-1">+{bonus}</span>}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-900 border border-stone-850 overflow-hidden">
                      <div
                        className="h-full bg-gold"
                        style={{ width: `${Math.min(100, ((base + bonus) / 15) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: LOGROS */}
        {activeTab === "logros" && (
          <div className="bg-panel border border-iron rounded-xs p-6 shadow-md text-center">
            <div className="text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-gold-soft/80 mb-2">
              Logros
            </div>
            <p className="text-[11px] font-mono text-text-muted">
              Victoria en batalla: {reports.filter((r) => r.success).length} · Derrota: {reports.filter((r) => !r.success).length}
            </p>
            <p className="text-[11px] font-mono text-text-muted mt-1">
              Arena: {arenaResults.filter((r) => r.success).length} / {arenaResults.length}
            </p>
          </div>
        )}

        {/* TAB: FAMILIA */}
        {activeTab === "familia" && (
          <div className="bg-panel border border-iron rounded-xs p-6 shadow-md text-center">
            <div className="text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-gold-soft/80 mb-2">
              Vinculo al perfil
            </div>
            <p className="text-[11px] font-mono text-text-muted">
              Envia este enlace a tus companeros para mostrar tu hoja de servicios.
            </p>
            <code className="block mt-2 px-3 py-1.5 bg-stone-900/50 border border-iron rounded-xs text-[10px] font-mono text-gold-soft break-all">
              https://s60-es.gladiatus.gameforce.com/game/index.php?mod=player&p={soldier.id}&language=es
            </code>
          </div>
        )}
      </div>
    </PageTransition>
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
  readOnly = false,
}: {
  slot: EquipmentSlot;
  label: string;
  equippedItemId: string | null;
  draggingItemId: string | null;
  draggedOverSlot: EquipmentSlot | null;
  onDragOver: (slot: EquipmentSlot, e: React.DragEvent) => void;
  onDrop: (slot: EquipmentSlot, e: React.DragEvent) => void;
  onDragStart: (slot: EquipmentSlot, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onSelect: (itemId: string) => void;
  readOnly?: boolean;
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
      onDragOver={(e) => { if (!readOnly) onDragOver(slot, e); }}
      onDrop={(e) => { if (!readOnly) onDrop(slot, e); }}
    >
      <div className={`equipment-slot w-[68px] h-[68px] rounded-xs border ${ringClass} bg-background/30 flex items-center justify-center transition-all`}>
        {item ? (
          <Tooltip type="item" itemId={item.id}>
            <button
              draggable={!readOnly}
              onDragStart={(e) => onDragStart(slot, e)}
              onDragEnd={onDragEnd}
              onDoubleClick={() => { if (!readOnly) onUnequip(slot); }}
              onClick={() => onSelect(item.id)}
              className="w-full h-full p-0.5 flex items-center justify-center relative group cursor-pointer"
            >
              <img
                src={getItemImagePath(item.id)}
                alt={item.name}
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              {!readOnly && (
                <span className="absolute top-0.5 right-0.5 text-danger bg-background/90 px-0.5 rounded-xs border border-iron/40 opacity-0 group-hover:opacity-100 text-[8px] font-bold leading-none">
                  <X className="w-2 h-2" />
                </span>
              )}
            </button>
          </Tooltip>
        ) : (
          <span className="text-[9px] text-muted/40 uppercase font-mono">{label.slice(0, 3)}</span>
        )}
      </div>
      <span className="text-[8px] text-text-muted uppercase font-mono mt-0.5 leading-none">
        {label}
      </span>
    </div>
  );
}

function StatLine({ label, value, bonus }: { label: string; value: string | number; bonus?: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-text-muted uppercase tracking-wider text-[10px]">{label}</span>
      <span className="text-gold font-bold">
        {value}
        {bonus !== undefined && bonus > 0 && (
          <span className="text-success text-[9px] ml-0.5">+{bonus}</span>
        )}
      </span>
    </div>
  );
}

function StatBar({
  label,
  value,
  ratio,
  barClass,
}: {
  label: string;
  value: string | number;
  ratio: number;
  barClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-text-muted uppercase tracking-wider text-[10px]">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-stone-900 border border-stone-850 overflow-hidden">
        <div
          className={`h-full ${barClass} transition-all`}
          style={{ width: `${Math.max(0, Math.min(100, ratio))}%` }}
        />
      </div>
      <span className="w-14 text-right text-gold-soft font-bold text-[10px]">{value}</span>
    </div>
  );
}
