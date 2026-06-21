// ArmorerChestPanel: baúl del armero con 3 pestañas (Productos, Objetos
// comunes, Vender arrastrando). Reemplaza los antiguos VendorChest "Mostrador"
// y "Venta" del /armory. Las dos primeras pestañas muestran el catálogo de la
// armería (Productos = todo, Objetos comunes = rarity === "common") con
// drag-to-buy y double-click-to-buy; la tercera es un drop zone plano para
// vender arrastrando desde el baúl del jugador.

"use client";

import { useMemo, useState } from "react";
import { ItemChestGrid, VENDOR_CHEST_GRID, footprintPx } from "@/components/soldier/item-chest-grid";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { getItem, getItemFootprint, getItemImagePath, shopInventory } from "@/lib/game-data";
import type { ShopItem } from "@/lib/types";

type DragSource = "merchant" | "backpack";
type ArmorerTab = "productos" | "comunes" | "vender";

const ARMORY_CELL_SIZE = VENDOR_CHEST_GRID.cellSize;

const armorerTabs: { id: ArmorerTab; label: string; iconId: "armory" | "chestChamber" | "coins" }[] = [
  { id: "productos", label: "Productos", iconId: "armory" },
  { id: "comunes", label: "Objetos comunes", iconId: "chestChamber" },
  { id: "vender", label: "Vender arrastrando", iconId: "coins" },
];

function getFootprintImageClassName(item: { footprint: { cols: number; rows: number } }) {
  const { footprint } = item;
  if (footprint.cols > footprint.rows) return "h-8 w-16";
  if (footprint.rows > footprint.cols) return "h-16 w-8";
  return "h-12 w-12";
}

export interface ArmorerChestPanelProps {
  dropTarget: DragSource | null;
  setDropTarget: (target: DragSource | null) => void;
  setDragged: (state: { source: DragSource; itemId: string } | null) => void;
  handleBuy: (itemId: string) => void;
  handleDrop: (target: DragSource) => void;
  soldierCoins: number;
  playPageSound: () => void;
}

export function ArmorerChestPanel({
  dropTarget,
  setDropTarget,
  setDragged,
  handleBuy,
  handleDrop,
  soldierCoins,
  playPageSound,
}: ArmorerChestPanelProps) {
  const [activeTab, setActiveTab] = useState<ArmorerTab>("productos");

  const commonShopRows = useMemo(
    () => shopInventory.filter((row) => getItem(row.itemId)?.rarity === "common"),
    [],
  );

  const onSwitchTab = (tab: ArmorerTab) => {
    if (tab === activeTab) return;
    playPageSound();
    setActiveTab(tab);
  };

  return (
    <div className="armorer-chest min-w-0 w-full max-w-full space-y-3">
      <div
        className="flex min-w-0 flex-wrap gap-1 border-b border-iron/60 pb-2"
        role="tablist"
        aria-label="Pestañas del baúl del armero"
      >
        {armorerTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSwitchTab(tab.id)}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                isActive
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-iron/70 text-text-muted hover:border-gold/40 hover:text-gold"
              }`}
            >
              <UiAssetIcon id={tab.iconId} label={tab.label} className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "productos" && (
        <VendorChestSection title="Mostrador">
          <ArmoryShopGrid
            rows={shopInventory}
            soldierCoins={soldierCoins}
            setDragged={setDragged}
            setDropTarget={setDropTarget}
            handleBuy={handleBuy}
          />
        </VendorChestSection>
      )}

      {activeTab === "comunes" && (
        <VendorChestSection title="Objetos comunes">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Piezas básicas de la armería. Sin florituras, sin nombre.
          </p>
          <ArmoryShopGrid
            rows={commonShopRows}
            soldierCoins={soldierCoins}
            setDragged={setDragged}
            setDropTarget={setDropTarget}
            handleBuy={handleBuy}
          />
        </VendorChestSection>
      )}

      {activeTab === "vender" && (
        <VendorChestSection title="Venta">
          <div
            data-armorer-sell-drop
            className={`relative flex min-h-[140px] items-center justify-center border-2 border-dashed p-4 text-center transition ${
              dropTarget === "merchant"
                ? "border-gold bg-gold/10 ring-2 ring-gold/25"
                : "border-iron/70 bg-stone-950/15"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDropTarget("merchant");
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDropTarget("merchant");
            }}
            onDragLeave={(event) => {
              const next = event.relatedTarget as Node | null;
              if (next && event.currentTarget.contains(next)) return;
              setDropTarget(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleDrop("merchant");
            }}
            aria-label="Suelta aquí para vender"
          >
            <div className="pointer-events-none space-y-1 font-mono text-xs uppercase">
              <UiAssetIcon id="coins" label="Vender" className="mx-auto h-8 w-8" />
              {dropTarget === "merchant" ? (
                <p className="text-gold">Suelta para vender</p>
              ) : (
                <p className="text-text-muted">Arrastra cualquier objeto del baúl aquí para venderlo al armero</p>
              )}
            </div>
          </div>
        </VendorChestSection>
      )}
    </div>
  );
}

function ArmoryShopGrid({
  rows,
  soldierCoins,
  setDragged,
  setDropTarget,
  handleBuy,
}: {
  rows: readonly ShopItem[];
  soldierCoins: number;
  setDragged: (state: { source: DragSource; itemId: string } | null) => void;
  setDropTarget: (target: DragSource | null) => void;
  handleBuy: (itemId: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="border border-dashed border-iron/60 bg-stone-950/30 px-3 py-6 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted">
        El armero no tiene nada en este apartado.
      </p>
    );
  }

  return (
    <ItemChestGrid
      metrics={{ ...VENDOR_CHEST_GRID, cellSize: ARMORY_CELL_SIZE }}
      className="armory-slot-grid"
    >
      {rows.map((row) => {
        const item = getItem(row.itemId);
        if (!item) return null;
        const canBuy = soldierCoins >= row.buyPrice && row.stock > 0;
        const footprint = getItemFootprint(item);
        const imageClassName = getFootprintImageClassName(item);
        return (
          <div
            key={row.itemId}
            style={{
              gridColumn: `span ${footprint.cols}`,
              gridRow: `span ${footprint.rows}`,
              width: footprintPx(footprint, VENDOR_CHEST_GRID, "x"),
              height: footprintPx(footprint, VENDOR_CHEST_GRID, "y"),
            }}
          >
            <Tooltip type="item" itemId={row.itemId} fill>
              <button
                type="button"
                className={`armory-market-row armory-item-slot relative flex h-full w-full items-center justify-center border bg-background/45 p-1 transition hover:border-gold/45 focus:border-gold focus:outline-hidden ${canBuy ? "cursor-grab" : "opacity-45"}`}
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
          </div>
        );
      })}
    </ItemChestGrid>
  );
}

function VendorChestSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 max-w-full space-y-2">
      <div className="flex items-center justify-between border-b border-iron/45 pb-1">
        <h3 className="font-cinzel text-xs font-bold uppercase tracking-[0.16em] text-gold-soft">{title}</h3>
      </div>
      <div className="min-w-0 max-w-full overflow-x-hidden pb-1">{children}</div>
    </section>
  );
}
