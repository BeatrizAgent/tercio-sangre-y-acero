"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useGameStore } from "@/lib/game-store";
import {
  BACKPACK_COLS,
  BACKPACK_CHESTS,
  BACKPACK_ROWS,
  inventoryWithAutoLayout,
} from "@/lib/domain/inventory-grid";
import {
  getEquipmentBonuses,
  getAssetPathById,
  getItem,
  getItemFootprint,
  getItemImagePath,
  formationRoleIconPaths,
  rankDefinitions,
} from "@/lib/game-data";
import { playPageSound, playSwordSound, playCoinSound } from "@/lib/sounds";
import { PageTransition } from "@/components/game/page-transition";
import { EquipmentMannequin } from "@/components/soldier/equipment-mannequin";
import { PlayerChestPanel } from "@/components/soldier/player-chest-panel";
import { SoldierSkeleton } from "@/components/skeletons/soldier-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { passiveShortLine, rarityStyle, TRIGGER_LABEL } from "@/lib/item-format";
import { STAT_LABELS } from "@/lib/stats";
import { getCharacterLevel } from "@/lib/domain/character-level";
import { useGameData } from "@/lib/hooks/use-game-data";
import { useOptimisticAction } from "@/lib/hooks/use-optimistic-action";
import { equipItemInState, unequipItemInState } from "@/lib/domain/equipment";
import { equipItemAction } from "@/lib/actions/equipment";
import type { CharacterState, Equipment, EquipmentSlot, FormationSlot, Passive, Stats, StatId } from "@/lib/types";

type Tab = "vision_general" | "estadisticas" | "logros" | "familia";

const STAT_ORDER: StatId[] = ["pike", "sword", "arquebus", "discipline", "vigor", "cunning", "command"];

type ProfilePreset = {
  id: string;
  name: string;
  role: string;
  rank: string;
  portraitAssetId: string;
  spriteSetId?: string;
  formationSlot: FormationSlot;
  level: number;
  stats: Stats;
  equipment: Equipment;
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
    level: getCharacterLevel(isPlayer ? soldier.stats : character.stats),
    equipment: isPlayer ? soldier.equipment : character.equipment,
  };
}

export default function SoldierPage() {
  const { status, error, refetch } = useGameData();
  const {
    soldier,
    characters,
    activeCharacterId,
    reports,
    arenaResults,
    sellItem,
    moveInventoryItem,
    setActiveCharacter,
  } = useGameStore();

  const { run: runEquip } = useOptimisticAction(
    equipItemAction,
    (state, args: { itemId: string }) => equipItemInState(state, args.itemId).next,
    {
      onSuccess: () => playSwordSound(),
      onError: (message) => {
        setNotification(message);
        window.setTimeout(() => setNotification(null), 2400);
      },
    },
  );
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

  const laidOutInventory = useMemo(
    () => inventoryWithAutoLayout(soldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS),
    [soldier.inventory],
  );

  if (status === "error") {
    return (
      <PageTransition>
        <ErrorState error={error} onRetry={refetch} />
      </PageTransition>
    );
  }

  if (status !== "ready") {
    return (
      <PageTransition>
        <SoldierSkeleton />
      </PageTransition>
    );
  }
  const activeProfile = profilePresets.find((profile) => profile.id === activeCharacterId) ?? profilePresets[0];
  const isPlayerProfile = activeProfile.id === "diego_de_arce";
  const activeEquipment = activeProfile.equipment;
  const activeStats = activeProfile.stats;
  const activeLevel = getCharacterLevel(activeStats);
  const activePortraitPath = getAssetPathById(activeProfile.portraitAssetId);
  const equipmentBonuses = getEquipmentBonuses(activeEquipment);

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
    runEquip({ itemId });
  };

  const handleUnequip = (slot: EquipmentSlot) => {
    const res = useGameStore.getState().unequipItem(slot);
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
            { key: "vision_general" as const, label: "Perfil" },
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
              <section className="overflow-hidden rounded-xs border border-iron bg-panel shadow-md">
                <div className="relative aspect-[4/5] bg-stone-950">
                  {activePortraitPath ? (
                    <Image
                      src={activePortraitPath}
                      alt={activeProfile.name}
                      fill
                      fetchPriority="high"
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase text-muted">
                      Sin retrato
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 border-t border-iron/70 bg-stone-950/88 px-3 py-2">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-cinzel text-base font-bold tracking-wider text-white">
                          {activeProfile.name}
                        </h2>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold-soft">
                          {activeProfile.role}
                        </p>
                      </div>
                      <img
                        src={formationRoleIconPaths[activeProfile.formationSlot]}
                        alt=""
                        className="h-9 w-9 shrink-0 object-contain"
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 p-2 text-[10px] font-mono uppercase tracking-wider">
                  <div className="rounded-xs border border-iron/60 bg-stone-900/50 px-2 py-1 text-text-muted">
                    Rango <span className="float-right text-gold">{activeProfile.rank}</span>
                  </div>
                  <div className="rounded-xs border border-iron/60 bg-stone-900/50 px-2 py-1 text-text-muted">
                    Vida <span className="float-right text-gold">{lifeRatio}%</span>
                  </div>
                </div>
              </section>

              {/* Stats list */}
              <div className="bg-panel border border-iron rounded-xs p-2.5 shadow-md space-y-1 text-[11px] font-mono">
                <StatLine label="Nivel" value={activeLevel} />
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
            <div className="min-w-0 lg:col-span-8 space-y-3">
              <EquipmentMannequin
                equipment={activeEquipment}
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

              <PlayerChestPanel
                profiles={profilePresets}
                activeProfileId={activeProfile.id}
                onProfileSelect={(profileId) => {
                  playPageSound();
                  setActiveCharacter(profileId);
                  setDraggedOverSlot(null);
                  setDraggingItemId(null);
                  setDraggingSlot(null);
                }}
                items={laidOutInventory}
                equipment={soldier.equipment}
                activeChest={activeChest}
                activeChestCells={activeChestCells}
                selectedItemId={selectedItemId}
                draggingItemId={draggingItemId}
                isOverBackpack={isOverBackpack}
                readOnly={!isPlayerProfile}
                onChestChange={(idx) => { playPageSound(); setActiveChest(idx); }}
                onSelectItem={(id) => { playPageSound(); setSelectedItemId(id); }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOverBackpack={(event) => {
                  if (isPlayerProfile && (draggingItemId || draggingSlot)) {
                    event.preventDefault();
                    setIsOverBackpack(true);
                  }
                }}
                onDragLeaveBackpack={() => setIsOverBackpack(false)}
                onDropBackpack={handleDropOnBackpack}
                onCellDrop={handleCellDrop}
              />

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
