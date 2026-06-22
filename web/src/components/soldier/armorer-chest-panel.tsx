// ArmorerChestPanel: baúl del armero con 4 pestañas (Armas, Armaduras, Otros,
// Vender). Usa rejillas de coordenadas absolutas (8x5) que simulan un inventario real
// con plantillas estéticas para evitar solapamientos y añadir más objetos deterministas diariamente.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ItemChestGrid, VENDOR_CHEST_GRID, footprintPx } from "@/components/soldier/item-chest-grid";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { getItem, getItemFootprint, getItemImagePath, shopInventory, itemDefinitions } from "@/lib/game-data";
import type { ShopItem } from "@/lib/types";

type DragSource = "merchant" | "backpack";
type ArmorerTab = "armas" | "armaduras" | "otros" | "vender";

const armorerTabs: { id: ArmorerTab; label: string; iconId: "armory" | "chestChamber" | "coins" | "confirm" }[] = [
  { id: "armas", label: "Armas", iconId: "armory" },
  { id: "armaduras", label: "Armaduras", iconId: "chestChamber" },
  { id: "otros", label: "Otros", iconId: "coins" },
  { id: "vender", label: "Vender", iconId: "confirm" },
];

function getFootprintImageClassName(item: { footprint: { cols: number; rows: number } }) {
  const { footprint } = item;
  if (footprint.cols > footprint.rows) return "h-8 w-16";
  if (footprint.rows > footprint.cols) return "h-16 w-8";
  return "h-12 w-12";
}

// 8x5 grid templates
const WEAPONS_TEMPLATE_SLOTS = {
  slots2x3: [
    { x: 0, y: 0 },
    { x: 4, y: 0 }
  ],
  slots1x3: [
    { x: 2, y: 0 },
    { x: 3, y: 2 },
    { x: 6, y: 0 },
    { x: 7, y: 2 }
  ],
  slots1x1: [
    { x: 2, y: 3 },
    { x: 2, y: 4 },
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 6, y: 3 },
    { x: 6, y: 4 },
    { x: 7, y: 0 },
    { x: 7, y: 1 }
  ]
};

const ARMORS_TEMPLATE_SLOTS = {
  slots2x2: [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 6, y: 0 },
    { x: 1, y: 2 },
    { x: 5, y: 2 }
  ],
  slots1x2: [
    { x: 2, y: 0 },
    { x: 5, y: 0 }
  ],
  slots1x1: [
    { x: 0, y: 2 },
    { x: 0, y: 3 },
    { x: 0, y: 4 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
    { x: 3, y: 4 },
    { x: 4, y: 2 },
    { x: 4, y: 3 },
    { x: 4, y: 4 },
    { x: 7, y: 2 },
    { x: 7, y: 3 },
    { x: 7, y: 4 },
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 5, y: 4 },
    { x: 6, y: 4 }
  ]
};

function getDailySeed(): number {
  if (typeof window === "undefined") return 42;
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function seededShuffle<T>(arr: T[], random: () => number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface LaidOutShopItem extends ShopItem {
  x: number;
  y: number;
}

export function generateShopStock(seed: number): {
  weapons: LaidOutShopItem[];
  armors: LaidOutShopItem[];
  others: LaidOutShopItem[];
} {
  const random = getSeededRandom(seed);
  
  // 1. Separate base shop inventory
  const baseWeapons2x3: ShopItem[] = [];
  const baseWeapons1x3: ShopItem[] = [];
  const baseWeapons1x1: ShopItem[] = [];
  const baseArmors2x2: ShopItem[] = [];
  const baseArmors1x1: ShopItem[] = [];
  const baseOthers1x1: ShopItem[] = [];

  shopInventory.forEach((row) => {
    const item = getItem(row.itemId);
    if (!item) return;
    const fp = getItemFootprint(item);
    
    if (item.slot === "mainHand") {
      if (fp.cols === 2 && fp.rows === 3) {
        baseWeapons2x3.push(row);
      } else {
        baseWeapons1x3.push(row);
      }
    } else if (item.slot === "body" && fp.cols === 2 && fp.rows === 2) {
      baseArmors2x2.push(row);
    } else if (item.slot === "head" || item.slot === "boots" || item.slot === "accessory") {
      if (item.slot === "head" || item.slot === "boots") {
        baseArmors1x1.push(row);
      } else {
        const isGunRelated = row.itemId.includes("polvora") || row.itemId.includes("plomo") || row.itemId.includes("mecha") || row.itemId.includes("aceite") || row.itemId.includes("piedra");
        if (isGunRelated) {
          baseWeapons1x1.push(row);
        } else {
          baseOthers1x1.push(row);
        }
      }
    } else {
      baseOthers1x1.push(row);
    }
  });

  // 2. Fetch catalog items for random filler
  const catalogWeapons2x3: string[] = [];
  const catalogWeapons1x3: string[] = [];
  const catalogWeapons1x1: string[] = [];
  const catalogArmors2x2: string[] = [];
  const catalogArmors1x2: string[] = [];
  const catalogArmors1x1: string[] = [];
  const catalogOthers1x1: string[] = [];

  itemDefinitions.forEach((item) => {
    const fp = getItemFootprint(item);
    if (item.slot === "mainHand") {
      if (fp.cols === 2 && fp.rows === 3) {
        catalogWeapons2x3.push(item.id);
      } else if (fp.cols === 1 && (fp.rows === 3 || fp.rows === 2)) {
        catalogWeapons1x3.push(item.id);
      }
    } else if (item.slot === "body" && fp.cols === 2 && fp.rows === 2) {
      catalogArmors2x2.push(item.id);
    } else if ((item.slot as string) === "legs" && fp.cols === 1 && fp.rows === 2) {
      catalogArmors1x2.push(item.id);
    } else if (item.slot === "head" || item.slot === "boots" || item.slot === "accessory" || item.slot === "consumable") {
      const isGunRelated = item.id.includes("polvora") || item.id.includes("plomo") || item.id.includes("mecha") || item.id.includes("aceite") || item.id.includes("piedra");
      if (fp.cols === 1 && fp.rows === 1) {
        if (isGunRelated) {
          catalogWeapons1x1.push(item.id);
        } else if (item.slot === "head" || item.slot === "boots" || item.slot === "accessory") {
          if (item.slot === "accessory" && !item.id.includes("gloves") && !item.id.includes("brazal")) {
            catalogOthers1x1.push(item.id);
          } else {
            catalogArmors1x1.push(item.id);
          }
        } else {
          catalogOthers1x1.push(item.id);
        }
      }
    }
  });

  const makeShopItem = (itemId: string): ShopItem => {
    const item = getItem(itemId)!;
    return {
      itemId,
      buyPrice: item.value,
      sellPrice: Math.max(1, Math.floor(item.value / 2)),
      stock: Math.floor(random() * 3) + 1,
    };
  };

  // --- WEAPONS ---
  const weaponsResult: LaidOutShopItem[] = [];
  const weapons2x3Pool = [...baseWeapons2x3];
  const shuffledCatalog2x3 = seededShuffle(catalogWeapons2x3, random);
  shuffledCatalog2x3.forEach((id) => {
    if (weapons2x3Pool.length < WEAPONS_TEMPLATE_SLOTS.slots2x3.length && !weapons2x3Pool.some(x => x.itemId === id)) {
      weapons2x3Pool.push(makeShopItem(id));
    }
  });
  WEAPONS_TEMPLATE_SLOTS.slots2x3.forEach((slot, idx) => {
    if (idx < weapons2x3Pool.length) {
      weaponsResult.push({ ...weapons2x3Pool[idx], ...slot });
    }
  });

  const weapons1x3Pool = [...baseWeapons1x3];
  const shuffledCatalog1x3 = seededShuffle(catalogWeapons1x3, random);
  shuffledCatalog1x3.forEach((id) => {
    if (weapons1x3Pool.length < WEAPONS_TEMPLATE_SLOTS.slots1x3.length && !weapons1x3Pool.some(x => x.itemId === id)) {
      weapons1x3Pool.push(makeShopItem(id));
    }
  });
  WEAPONS_TEMPLATE_SLOTS.slots1x3.forEach((slot, idx) => {
    if (idx < weapons1x3Pool.length) {
      weaponsResult.push({ ...weapons1x3Pool[idx], ...slot });
    }
  });

  const weapons1x1Pool = [...baseWeapons1x1];
  const shuffledCatalog1x1 = seededShuffle(catalogWeapons1x1, random);
  shuffledCatalog1x1.forEach((id) => {
    if (weapons1x1Pool.length < WEAPONS_TEMPLATE_SLOTS.slots1x1.length && !weapons1x1Pool.some(x => x.itemId === id)) {
      weapons1x1Pool.push(makeShopItem(id));
    }
  });
  WEAPONS_TEMPLATE_SLOTS.slots1x1.forEach((slot, idx) => {
    if (idx < weapons1x1Pool.length) {
      weaponsResult.push({ ...weapons1x1Pool[idx], ...slot });
    }
  });

  // --- ARMORS ---
  const armorsResult: LaidOutShopItem[] = [];
  const armors2x2Pool = [...baseArmors2x2];
  const shuffledArmors2x2 = seededShuffle(catalogArmors2x2, random);
  shuffledArmors2x2.forEach((id) => {
    if (armors2x2Pool.length < ARMORS_TEMPLATE_SLOTS.slots2x2.length && !armors2x2Pool.some(x => x.itemId === id)) {
      armors2x2Pool.push(makeShopItem(id));
    }
  });
  ARMORS_TEMPLATE_SLOTS.slots2x2.forEach((slot, idx) => {
    if (idx < armors2x2Pool.length) {
      armorsResult.push({ ...armors2x2Pool[idx], ...slot });
    }
  });

  const armors1x2Pool: ShopItem[] = [];
  const shuffledLegs = seededShuffle(catalogArmors1x2, random);
  shuffledLegs.forEach((id) => {
    if (armors1x2Pool.length < ARMORS_TEMPLATE_SLOTS.slots1x2.length) {
      armors1x2Pool.push(makeShopItem(id));
    }
  });
  ARMORS_TEMPLATE_SLOTS.slots1x2.forEach((slot, idx) => {
    if (idx < armors1x2Pool.length) {
      armorsResult.push({ ...armors1x2Pool[idx], ...slot });
    }
  });

  const armors1x1Pool = [...baseArmors1x1];
  const shuffledCatalogArmors1x1 = seededShuffle(catalogArmors1x1, random);
  shuffledCatalogArmors1x1.forEach((id) => {
    if (armors1x1Pool.length < ARMORS_TEMPLATE_SLOTS.slots1x1.length && !armors1x1Pool.some(x => x.itemId === id)) {
      armors1x1Pool.push(makeShopItem(id));
    }
  });
  ARMORS_TEMPLATE_SLOTS.slots1x1.forEach((slot, idx) => {
    if (idx < armors1x1Pool.length) {
      armorsResult.push({ ...armors1x1Pool[idx], ...slot });
    }
  });

  // --- OTHERS ---
  const othersResult: LaidOutShopItem[] = [];
  const othersPool = [...baseOthers1x1];
  const shuffledCatalogOthers = seededShuffle(catalogOthers1x1, random);
  shuffledCatalogOthers.forEach((id) => {
    if (othersPool.length < 16 && !othersPool.some(x => x.itemId === id)) {
      othersPool.push(makeShopItem(id));
    }
  });

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 8; x++) {
      cells.push({ x, y });
    }
  }
  const shuffledCells = seededShuffle(cells, random);
  othersPool.forEach((item, idx) => {
    if (idx < shuffledCells.length) {
      othersResult.push({ ...item, ...shuffledCells[idx] });
    }
  });

  return {
    weapons: weaponsResult,
    armors: armorsResult,
    others: othersResult,
  };
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
  const [activeTab, setActiveTab] = useState<ArmorerTab>("armas");
  const [dailySeed] = useState(() => getDailySeed());
  const shopStock = useMemo(() => generateShopStock(dailySeed), [dailySeed]);

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

      {activeTab === "armas" && (
        <VendorChestSection title="Armas e Instrumentos de Fuego">
          <ArmoryShopGrid
            rows={shopStock.weapons}
            soldierCoins={soldierCoins}
            setDragged={setDragged}
            setDropTarget={setDropTarget}
            handleBuy={handleBuy}
          />
        </VendorChestSection>
      )}

      {activeTab === "armaduras" && (
        <VendorChestSection title="Protección de Acero y Cuero">
          <ArmoryShopGrid
            rows={shopStock.armors}
            soldierCoins={soldierCoins}
            setDragged={setDragged}
            setDropTarget={setDropTarget}
            handleBuy={handleBuy}
          />
        </VendorChestSection>
      )}

      {activeTab === "otros" && (
        <VendorChestSection title="Consumibles y Pertrechos">
          <ArmoryShopGrid
            rows={shopStock.others}
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
  rows: LaidOutShopItem[];
  soldierCoins: number;
  setDragged: (state: { source: DragSource; itemId: string } | null) => void;
  setDropTarget: (target: DragSource | null) => void;
  handleBuy: (itemId: string) => void;
}) {
  const gridHostRef = useRef<HTMLDivElement>(null);
  const [gridHostWidth, setGridHostWidth] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      return 332;
    }
    return 0;
  });

  const gridMetrics = useMemo(() => {
    const baseGrid = VENDOR_CHEST_GRID;
    if (gridHostWidth <= 0) {
      return { ...baseGrid, cellSize: 56, rows: 5 };
    }
    const available = gridHostWidth;
    const maxCell = Math.floor(
      (available - baseGrid.padding * 2 - (baseGrid.cols - 1) * baseGrid.gap) / baseGrid.cols
    );
    return {
      ...baseGrid,
      cellSize: Math.max(32, Math.min(56, maxCell)),
      rows: 5
    };
  }, [gridHostWidth]);

  useEffect(() => {
    const host = gridHostRef.current;
    if (!host) return;
    const updateWidth = () => setGridHostWidth(host.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  if (rows.length === 0) {
    return (
      <p className="border border-dashed border-iron/60 bg-stone-950/30 px-3 py-6 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted">
        El armero no tiene nada en este apartado.
      </p>
    );
  }

  // Map to InventoryItem format to pass to ItemChestGrid
  const inventoryItems = rows.map((r) => ({
    itemId: r.itemId,
    quantity: r.stock,
    x: r.x,
    y: r.y,
  }));

  return (
    <div ref={gridHostRef} className="flex min-w-0 justify-center overflow-x-hidden pb-1">
      <ItemChestGrid
        metrics={gridMetrics}
        inventory={inventoryItems}
        className="armory-slot-grid"
        renderItem={(invItem, metrics) => {
          const row = rows.find((r) => r.itemId === invItem.itemId);
          if (!row) return null;
          const item = getItem(row.itemId);
          if (!item) return null;
          const canBuy = soldierCoins >= row.buyPrice && row.stock > 0;
          const footprint = getItemFootprint(item);
          const imageClassName = getFootprintImageClassName(item);
          return (
            <Tooltip type="item" itemId={row.itemId} fill>
              <button
                type="button"
                className={`armory-market-row armory-item-slot relative flex h-full w-full items-center justify-center border bg-background/45 p-1 transition hover:border-gold/45 focus:border-gold focus:outline-hidden ${canBuy ? "cursor-grab" : "opacity-45"}`}
                style={{
                  width: footprintPx(footprint, metrics, "x"),
                  height: footprintPx(footprint, metrics, "y"),
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
        }}
      />
    </div>
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
