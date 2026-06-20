"use client";

import React, { useMemo, useState } from "react";
import { PageTransition } from "@/components/game/page-transition";
import { Badge, Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { NpcOfferFrame } from "@/components/game/visual-offers";
import { PlayerChestPanel } from "@/components/soldier/player-chest-panel";
import { ItemChestGrid, VENDOR_CHEST_GRID, footprintPx } from "@/components/soldier/item-chest-grid";
import { featuredAssetPaths, getItem, getItemFootprint, getItemImagePath, shopInventory } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import { playCoinSound, playDefeatSound, playPageSound } from "@/lib/sounds";
import { BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS, inventoryWithAutoLayout } from "@/lib/inventory-grid";
import type { ItemDefinition, InventoryItem } from "@/lib/types";

type DragSource = "merchant" | "backpack";

const ARMORY_CELL_SIZE = VENDOR_CHEST_GRID.cellSize;

const categoryFilters = [
  { id: "all", label: "Todo" },
  { id: "weapon", label: "Armas" },
  { id: "armor", label: "Defensa" },
  { id: "supply", label: "Pertrechos" },
] as const;

function getFilterGroup(item: ItemDefinition) {
  if (["pike", "sword", "firearm"].includes(item.category)) return "weapon";
  if (["armor", "helmet", "boots", "coat"].includes(item.category)) return "armor";
  return "supply";
}

function getFootprintImageClassName(item: ItemDefinition) {
  const footprint = getItemFootprint(item);
  if (footprint.cols > footprint.rows) return "h-8 w-16";
  if (footprint.rows > footprint.cols) return "h-16 w-8";
  return "h-12 w-12";
}

export default function ArmoryPage() {
  const { soldier, characters, activeCharacterId, setActiveCharacter, buyItem, sellItem, payTownBribe } = useGameStore();
  const [categoryFilter, setCategoryFilter] = useState<(typeof categoryFilters)[number]["id"]>("all");
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [dragged, setDragged] = useState<{ source: DragSource; itemId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<DragSource | null>(null);
  const [activeChest, setActiveChest] = useState(0);

  const filteredShopRows = useMemo(
    () =>
      shopInventory.filter((row) => {
        const item = getItem(row.itemId);
        if (!item) return false;
        return categoryFilter === "all" || getFilterGroup(item) === categoryFilter;
      }),
    [categoryFilter]
  );

  const laidOutInventory = useMemo<InventoryItem[]>(
    () => inventoryWithAutoLayout(soldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS),
    [soldier.inventory],
  );
  const activeChestInventory = laidOutInventory.filter((entry) => (entry.chest ?? 0) === activeChest);
  const activeChestCells = activeChestInventory.reduce((sum, invItem) => {
    const item = getItem(invItem.itemId);
    const footprint = getItemFootprint(item);
    return sum + footprint.cols * footprint.rows;
  }, 0);
  const profileTabs = characters.map((character) => ({
    id: character.id,
    name: character.name,
    role: character.role,
    portraitAssetId: character.portraitAssetId,
    formationSlot: character.formationSlot,
  }));

  const showNotice = (text: string, isError: boolean) => {
    setNotice({ text, isError });
    window.setTimeout(() => setNotice(null), 2600);
  };

  const handleBuy = (itemId: string) => {
    const result = buyItem(itemId);
    if (result.ok) {
      playCoinSound();
      showNotice(result.message, false);
    } else {
      playDefeatSound();
      showNotice(result.message, true);
    }
  };

  const handleSell = (itemId: string) => {
    const equipped = Object.values(soldier.equipment).includes(itemId);
    const owned = soldier.inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
    if (equipped && owned <= 1) {
      playDefeatSound();
      showNotice("No puedes vender la unica pieza equipada. Desequipala primero.", true);
      return;
    }

    const result = sellItem(itemId);
    if (result.ok) {
      playCoinSound();
      showNotice(result.message, false);
    } else {
      playDefeatSound();
      showNotice(result.message, true);
    }
  };

  const handleDrop = (target: DragSource) => {
    if (!dragged) return;
    if (dragged.source === "merchant" && target === "backpack") handleBuy(dragged.itemId);
    if (dragged.source === "backpack" && target === "merchant") handleSell(dragged.itemId);
    setDragged(null);
    setDropTarget(null);
  };

  const handleBackpackDrop = (event: React.DragEvent) => {
    event.preventDefault();
    handleDrop("backpack");
  };

  const handleBackpackCellDrop = (_x: number, _y: number, event: React.DragEvent) => {
    handleBackpackDrop(event);
  };

  if (soldier.banMissionsLeft > 0) {
    return (
      <PageTransition>
        <Card title="Acceso prohibido" iconId="armory">
          <div className="space-y-4 text-sm text-text-muted">
            <p>Los mercaderes han cerrado sus puestos. Quedan {soldier.banMissionsLeft} misiones de destierro.</p>
            <button
              type="button"
              disabled={soldier.coins < 50}
              onClick={() => {
                const result = payTownBribe();
                showNotice(result.message, !result.ok);
              }}
              className="iron-button text-xs"
            >
              Sobornar al alguacil (50)
            </button>
          </div>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-iron pb-3">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="armory" label="Armeria" className="h-9 w-9" />
            <div>
              <h1 className="font-cinzel text-2xl font-extrabold uppercase tracking-wider text-gold md:text-3xl">Armeria</h1>
            </div>
          </div>
          <Badge variant="gold">{soldier.coins} doblones</Badge>
        </header>

        {notice && (
          <div className={`border px-3 py-2 font-mono text-xs ${notice.isError ? "border-danger/40 bg-danger/10 text-danger" : "border-success/40 bg-success/10 text-success"}`}>
            {notice.text}
          </div>
        )}

        <div className="grid min-w-0 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <NpcOfferFrame
            model={{
              id: "armorer",
              title: "Mercader",
              subtitle: "Armeria",
              portraitSrc: featuredAssetPaths.armorerPortrait,
              sceneSrc: featuredAssetPaths.armory,
              offers: [
                { id: "coins", iconId: "coins", label: "Doblones", value: soldier.coins, tooltip: "Doblones disponibles" },
                { id: "stock", iconId: "inventory", label: "Piezas", value: filteredShopRows.length, tooltip: "Objetos en venta" },
                { id: "sell", iconId: "cityHouseOfTrade", label: "Vender", value: "drag", tooltip: "Arrastra del baul al mercader para vender" },
                { id: "buy", iconId: "confirm", label: "Comprar", value: "doble", tooltip: "Doble click para comprar" },
              ],
            }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-iron pb-2">
              <div className="flex flex-wrap gap-1">
                {categoryFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      playPageSound();
                      setCategoryFilter(filter.id);
                    }}
                    className={`border px-2 py-1 font-mono text-[11px] uppercase ${categoryFilter === filter.id ? "border-gold/60 bg-gold/10 text-gold-soft" : "border-iron text-text-muted hover:border-gold/35"}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <VendorChest title="Mostrador">
              <ItemChestGrid metrics={{ ...VENDOR_CHEST_GRID, cellSize: ARMORY_CELL_SIZE }} className="armory-slot-grid">
                {filteredShopRows.map((row) => {
                  const item = getItem(row.itemId);
                  if (!item) return null;
                  const canBuy = soldier.coins >= row.buyPrice && row.stock > 0;
                  const footprint = getItemFootprint(item);
                  const imageClassName = getFootprintImageClassName(item);
                  return (
                    <Tooltip key={row.itemId} type="item" itemId={row.itemId}>
                      <button
                        type="button"
                        className={`armory-market-row armory-item-slot relative flex items-center justify-center border bg-background/45 p-1 transition hover:border-gold/45 focus:border-gold focus:outline-hidden ${canBuy ? "cursor-grab" : "opacity-45"}`}
                        style={{
                          gridColumn: `span ${footprint.cols}`,
                          gridRow: `span ${footprint.rows}`,
                          width: footprintPx(footprint, VENDOR_CHEST_GRID, "x"),
                          height: footprintPx(footprint, VENDOR_CHEST_GRID, "y"),
                        }}
                        draggable={canBuy}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", row.itemId);
                          setDragged({ source: "merchant", itemId: row.itemId });
                        }}
                        onDragEnd={() => {
                          setDragged(null);
                          setDropTarget(null);
                        }}
                        onDoubleClick={() => handleBuy(row.itemId)}
                        aria-label={`${item.name}. Arrastra para comprar.`}
                      >
                        <img
                          src={getItemImagePath(row.itemId)}
                          alt=""
                          className={`${imageClassName} max-h-full max-w-full object-contain`}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      </button>
                    </Tooltip>
                  );
                })}
              </ItemChestGrid>
            </VendorChest>

            <VendorChest title="Venta">
              <DropZone
                target="merchant"
                active={dropTarget === "merchant"}
                onDropTarget={setDropTarget}
                onDrop={handleDrop}
                label="Suelta aqui para vender"
              >
              <ItemChestGrid metrics={{ ...VENDOR_CHEST_GRID, cellSize: ARMORY_CELL_SIZE }} className="armory-slot-grid" />
              </DropZone>
            </VendorChest>
          </NpcOfferFrame>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDropTarget("backpack");
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={handleBackpackDrop}
          >
            <PlayerChestPanel
              profiles={profileTabs}
              activeProfileId={activeCharacterId}
              onProfileSelect={(id) => {
                playPageSound();
                setActiveCharacter(id);
              }}
              items={laidOutInventory}
              equipment={soldier.equipment}
              activeChest={activeChest}
              activeChestCells={activeChestCells}
              selectedItemId={null}
              draggingItemId={dragged?.itemId ?? null}
              isOverBackpack={dropTarget === "backpack"}
              onChestChange={(idx) => {
                playPageSound();
                setActiveChest(idx);
              }}
              onSelectItem={handleSell}
              onDragStart={(itemId, event) => {
                event.dataTransfer.setData("text/plain", itemId);
                setDragged({ source: "backpack", itemId });
              }}
              onDragEnd={() => {
                setDragged(null);
                setDropTarget(null);
              }}
              onDragOverBackpack={(event) => {
                event.preventDefault();
                setDropTarget("backpack");
              }}
              onDragLeaveBackpack={() => setDropTarget(null)}
              onDropBackpack={handleBackpackDrop}
              onCellDrop={handleBackpackCellDrop}
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function VendorChest({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b border-iron/45 pb-1">
        <h3 className="font-cinzel text-xs font-bold uppercase tracking-[0.16em] text-gold-soft">{title}</h3>
      </div>
      <div className="overflow-x-auto pb-1">{children}</div>
    </section>
  );
}

function DropZone({
  target,
  active,
  label,
  children,
  onDropTarget,
  onDrop,
}: {
  target: DragSource;
  active: boolean;
  label: string;
  children: React.ReactNode;
  onDropTarget: (target: DragSource | null) => void;
  onDrop: (target: DragSource) => void;
}) {
  return (
    <div
      className={`armory-dropzone max-w-full overflow-hidden border border-dashed p-2 transition ${active ? "border-gold bg-gold/10 ring-2 ring-gold/25" : "border-iron/70 bg-stone-950/15"}`}
      onDragOver={(event) => {
        event.preventDefault();
        onDropTarget(target);
      }}
      onDragLeave={() => onDropTarget(null)}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(target);
      }}
      aria-label={label}
    >
      {active && <div className="mb-2 border border-gold/45 bg-background/85 px-2 py-1 text-center font-mono text-xs uppercase text-gold">{label}</div>}
      {children}
    </div>
  );
}
