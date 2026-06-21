// ChaplainChestPanel: baúl del capellán con 4 pestañas (Ofrendar,
// Bendiciones, Reliquias, Encargos). Mismo patrón que el ArmorerChestPanel:
// Ofrendar = drop zone para ofrendar items al capellán (sacrificio);
// Bendiciones = ofrendas de la capilla; Reliquias = amuletos y reliquias
// en venta; Encargos = 3 misiones con botón de pago.

"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { churchBlessings, churchInventory, getItem } from "@/lib/game-data";
import { playCoinSound } from "@/lib/sounds";
import type { ActionResult } from "@/lib/domain/result";
import type { ShopItem } from "@/lib/types";

type DragSource = "merchant" | "backpack";
type ChaplainTab = "vende" | "bendiciones" | "reliquias" | "encargos";

const chaplainTabs: { id: ChaplainTab; label: string; iconId: "coins" | "churchBlessing" | "churchAmulet" | "churchErrand" }[] = [
  { id: "vende", label: "Ofrendar", iconId: "coins" },
  { id: "bendiciones", label: "Bendiciones", iconId: "churchBlessing" },
  { id: "reliquias", label: "Reliquias", iconId: "churchAmulet" },
  { id: "encargos", label: "Encargos", iconId: "churchErrand" },
];

const churchErrands = [
  {
    id: "enterrar_sin_nombre",
    title: "Enterrar a los sin nombre",
    icon: "churchErrand" as const,
    cost: 6,
    description: "Abrir tierra fria para hombres que nadie reclama.",
  },
  {
    id: "escoltar_relicario",
    title: "Escoltar el relicario",
    icon: "shield" as const,
    cost: 10,
    description: "Llevar plata vieja por caminos donde todo brilla demasiado.",
  },
  {
    id: "buscar_capellan_perdido",
    title: "Buscar al capellan perdido",
    icon: "missions" as const,
    cost: 15,
    description: "Una patrulla encontro su mula, pero no al hombre.",
  },
] as const;

function effectLabel(effects: (typeof churchBlessings)[number]["effects"]) {
  return Object.entries(effects)
    .map(([key, value]) => `${value > 0 ? "+" : ""}${value} ${key}`)
    .join(" · ");
}

export interface ChaplainChestPanelProps {
  dropTarget: DragSource | null;
  setDropTarget: (target: DragSource | null) => void;
  handleDrop: (target: DragSource) => void;
  handleBuyBlessing: (blessingId: string) => ActionResult;
  handleBuyChurchItem: (itemId: string) => ActionResult;
  handlePayErrand: (cost: number) => void;
  soldierCoins: number;
  playPageSound: () => void;
}

export function ChaplainChestPanel({
  dropTarget,
  setDropTarget,
  handleDrop,
  handleBuyBlessing,
  handleBuyChurchItem,
  handlePayErrand,
  soldierCoins,
  playPageSound,
}: ChaplainChestPanelProps) {
  const [activeTab, setActiveTab] = useState<ChaplainTab>("vende");

  const onSwitchTab = (tab: ChaplainTab) => {
    if (tab === activeTab) return;
    playPageSound();
    setActiveTab(tab);
  };

  return (
    <div className="chaplain-chest min-w-0 w-full max-w-full space-y-3">
      <div
        className="flex min-w-0 flex-wrap gap-1 border-b border-iron/60 pb-2"
        role="tablist"
        aria-label="Pestañas del baúl del capellán"
      >
        {chaplainTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onSwitchTab(tab.id)}
            className={`flex items-center gap-1.5 border px-2.5 py-1.5 font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] transition ${
              activeTab === tab.id
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-iron/70 text-text-muted hover:border-gold/40 hover:text-gold"
            }`}
          >
            <UiAssetIcon id={tab.iconId} label={tab.label} className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "vende" && (
        <VendorChestSection title="Ofrendar">
          <div
            data-chaplain-donate-drop
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
            aria-label="Suelta aquí para ofrendar al capellán"
          >
            <div className="pointer-events-none space-y-1 font-mono text-xs uppercase">
              <UiAssetIcon id="churchBlessing" label="Ofrendar" className="mx-auto h-8 w-8" />
              {dropTarget === "merchant" ? (
                <p className="text-gold">Suelta para ofrendar</p>
              ) : (
                <p className="text-text-muted">Arrastra cualquier objeto del baúl aquí para ofrendarlo al capellán</p>
              )}
            </div>
          </div>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Ofrenda sin recompensa: el item pasa al capellán
          </p>
        </VendorChestSection>
      )}

      {activeTab === "bendiciones" && (
        <VendorChestSection title="Bendiciones">
          {(churchBlessings as readonly unknown[]).length === 0 ? (
            <p className="border border-dashed border-iron/60 bg-stone-950/30 px-3 py-6 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted">
              El capellán no tiene ofrendas disponibles.
            </p>
          ) : (
            <div className="space-y-2">
              {churchBlessings.map((blessing) => {
                const canBuy = soldierCoins >= blessing.cost;
                return (
                  <button
                    key={blessing.id}
                    type="button"
                    disabled={!canBuy}
                    onClick={() => {
                      const result = handleBuyBlessing(blessing.id);
                      if (result.ok) playCoinSound();
                    }}
                    className="group w-full border border-iron bg-background/35 p-3 text-left transition hover:border-gold/45 hover:bg-panel-raised disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <div className="flex items-start gap-3">
                      <UiAssetIcon id="churchBlessing" label={blessing.name} className="h-8 w-8 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-cinzel text-sm font-extrabold uppercase text-gold-soft">
                            {blessing.name}
                          </h4>
                          <span className="font-mono text-[11px] font-bold text-gold">{blessing.cost} dob</span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">{blessing.description}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase text-success">{effectLabel(blessing.effects)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </VendorChestSection>
      )}

      {activeTab === "reliquias" && (
        <VendorChestSection title="Reliquias">
          {churchInventory.length === 0 ? (
            <p className="border border-dashed border-iron/60 bg-stone-950/30 px-3 py-6 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted">
              El relicario está vacío. Vuelve cuando lleguen nuevas reliquias de Santiago.
            </p>
          ) : (
            <RelicGrid rows={churchInventory} soldierCoins={soldierCoins} handleBuyChurchItem={handleBuyChurchItem} />
          )}
        </VendorChestSection>
      )}

      {activeTab === "encargos" && (
        <VendorChestSection title="Encargos">
          <div className="space-y-2">
            {churchErrands.map((errand) => {
              const canPay = soldierCoins >= errand.cost;
              return (
                <article key={errand.id} className="border border-iron bg-background/35 p-3">
                  <div className="flex items-start gap-3">
                    <UiAssetIcon id={errand.icon} label={errand.title} className="h-8 w-8 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-cinzel text-sm font-extrabold uppercase text-gold-soft">
                          {errand.title}
                        </h4>
                        <span className="font-mono text-[11px] font-bold text-gold">{errand.cost} dob</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">{errand.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!canPay}
                      onClick={() => handlePayErrand(errand.cost)}
                      className="iron-button shrink-0 px-2 py-1 text-[10px] disabled:opacity-45"
                    >
                      <ScrollText className="h-3 w-3" />
                      <span className="ml-1">Pagar</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </VendorChestSection>
      )}
    </div>
  );
}

function RelicGrid({
  rows,
  soldierCoins,
  handleBuyChurchItem,
}: {
  rows: readonly ShopItem[];
  soldierCoins: number;
  handleBuyChurchItem: (itemId: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => {
        const item = getItem(row.itemId);
        const canBuy = soldierCoins >= row.buyPrice && row.stock > 0;
        return (
          <button
            key={row.itemId}
            type="button"
            disabled={!canBuy}
            onClick={() => handleBuyChurchItem(row.itemId)}
            className="border border-iron bg-background/35 p-2 text-left transition hover:border-gold/45 hover:bg-panel-raised disabled:cursor-not-allowed disabled:opacity-45"
          >
            <div className="flex items-center gap-2">
              <UiAssetIcon id="churchAmulet" label={item?.name ?? row.itemId} className="h-8 w-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-cinzel text-[11px] font-extrabold uppercase text-gold-soft">
                  {item?.name ?? row.itemId}
                </p>
                <p className="font-mono text-[10px] text-gold">{row.buyPrice} dob</p>
              </div>
            </div>
          </button>
        );
      })}
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
