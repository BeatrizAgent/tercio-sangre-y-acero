"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Cross, ScrollText, ShieldCheck } from "lucide-react";
import { PageTransition } from "@/components/game/page-transition";
import { Badge, Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { NpcOfferFrame } from "@/components/game/visual-offers";
import { PlayerChestPanel } from "@/components/soldier/player-chest-panel";
import { BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS, inventoryWithAutoLayout } from "@/lib/inventory-grid";
import {
  assetPath,
  churchBlessings,
  churchInventory,
  featuredAssetPaths,
  getItem,
  getItemFootprint,
  getItemImagePath,
} from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import { playCoinSound, playDefeatSound, playPageSound } from "@/lib/sounds";

const churchErrands = [
  {
    id: "enterrar_sin_nombre",
    title: "Enterrar a los sin nombre",
    icon: "churchErrand",
    reward: "+2 honor",
    risk: "Fatiga media",
    description: "Abrir tierra fria para hombres que nadie reclama.",
    href: "/missions?region=flandes",
  },
  {
    id: "escoltar_relicario",
    title: "Escoltar el relicario",
    icon: "shield",
    reward: "Reliquia posible",
    risk: "Camino inseguro",
    description: "Llevar plata vieja por caminos donde todo brilla demasiado.",
    href: "/missions?region=italia",
  },
  {
    id: "buscar_capellan_perdido",
    title: "Buscar al capellan perdido",
    icon: "missions",
    reward: "XP y reputacion",
    risk: "Emboscada",
    description: "Una patrulla encontro su mula, pero no al hombre.",
    href: "/missions?region=francia",
  },
] as const;

function effectLabel(effects: (typeof churchBlessings)[number]["effects"]) {
  return Object.entries(effects)
    .map(([key, value]) => `${value > 0 ? "+" : ""}${value} ${key}`)
    .join(" · ");
}

export default function ChurchPage() {
  const { soldier, buyChurchBlessing, buyChurchItem } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [activeChest, setActiveChest] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const inventoryRows = useMemo(
    () =>
      churchInventory.map((row) => ({
        ...row,
        item: getItem(row.itemId),
      })),
    [],
  );
  const laidOutInventory = useMemo(
    () => inventoryWithAutoLayout(soldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS),
    [soldier.inventory],
  );
  const activeChestCells = laidOutInventory
    .filter((entry) => (entry.chest ?? 0) === activeChest)
    .reduce((sum, invItem) => {
      const item = getItem(invItem.itemId);
      const footprint = getItemFootprint(item);
      return sum + footprint.cols * footprint.rows;
    }, 0);

  const showNotice = (text: string, isError = false) => {
    setNotice({ text, isError });
    window.setTimeout(() => setNotice(null), 2600);
  };

  if (!mounted) {
    return <div className="py-12 text-center font-cinzel text-xl text-gold animate-pulse">Encendiendo cirios...</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-iron pb-3">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="cityChurch" label="Iglesia" className="h-12 w-12" />
            <div>
              <h1 className="font-cinzel text-2xl font-extrabold uppercase tracking-wider text-gold md:text-3xl">
                Iglesia
              </h1>
              <p className="text-sm text-text-muted">Cirios, relicarios, encargos piadosos y cuentas sucias.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right font-mono text-xs uppercase">
            <Badge variant="gold">{soldier.coins} doblones</Badge>
            <Badge variant="default">Honor {soldier.honor}</Badge>
          </div>
        </header>

        {notice && (
          <div
            className={`border px-3 py-2 font-mono text-xs ${
              notice.isError ? "border-danger/40 bg-danger/10 text-danger" : "border-success/40 bg-success/10 text-success"
            }`}
          >
            {notice.text}
          </div>
        )}

        <NpcOfferFrame
          model={{
            id: "chaplain",
            title: "Capellan",
            subtitle: "Capilla de la plaza",
            portraitSrc: assetPath("portraits/npcs/chaplain_portrait.png"),
            sceneSrc: featuredAssetPaths.church,
            offers: [
              { id: "coins", iconId: "coins", label: "Doblones", value: soldier.coins, tooltip: "Doblones disponibles" },
              { id: "honor", iconId: "honor", label: "Honor", value: soldier.honor, tooltip: "Honor actual" },
              { id: "blessings", iconId: "churchBlessing", label: "Bendiciones", value: churchBlessings.length, tooltip: "Ofrendas disponibles" },
              { id: "relics", iconId: "churchAmulet", label: "Reliquias", value: inventoryRows.length, tooltip: "Amuletos en venta" },
            ],
          }}
        />

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card title="Encargos del capellan" iconId="churchErrand">
            <div className="space-y-2">
              {churchErrands.map((errand) => (
                <article key={errand.id} className="border border-iron bg-background/35 p-3">
                  <div className="flex items-start gap-3">
                    <UiAssetIcon id={errand.icon} label={errand.title} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-cinzel text-base font-extrabold uppercase text-gold-soft">{errand.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-text-muted">{errand.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px] uppercase">
                        <span className="border border-success/30 bg-success/10 px-2 py-1 text-success">{errand.reward}</span>
                        <span className="border border-warning/30 bg-warning/10 px-2 py-1 text-warning">{errand.risk}</span>
                      </div>
                    </div>
                    <Link
                      href={errand.href}
                      onClick={() => {
                        playPageSound();
                        showNotice(`Encargo anotado: ${errand.title}. Busca el nodo de campana.`, false);
                      }}
                      className="iron-button shrink-0 px-3 py-2 text-xs"
                    >
                      <ScrollText className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </Card>

          <Card title="Bendiciones" iconId="churchBlessing">
            <div className="space-y-2">
              {churchBlessings.map((blessing) => {
                const canBuy = soldier.coins >= blessing.cost;
                return (
                  <button
                    key={blessing.id}
                    type="button"
                    disabled={!canBuy}
                    onClick={() => {
                      const result = buyChurchBlessing(blessing.id);
                      if (result.ok) playCoinSound();
                      else playDefeatSound();
                      showNotice(result.message, !result.ok);
                    }}
                    className="group w-full border border-iron bg-background/35 p-3 text-left transition hover:border-gold/45 hover:bg-panel-raised disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <div className="flex items-start gap-3">
                      <UiAssetIcon id="churchBlessing" label={blessing.name} className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-cinzel text-base font-extrabold uppercase text-gold-soft">
                            {blessing.name}
                          </h3>
                          <span className="font-mono text-xs font-bold text-gold">{blessing.cost} dob</span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-text-muted">{blessing.description}</p>
                        <p className="mt-2 font-mono text-[11px] uppercase text-success">{effectLabel(blessing.effects)}</p>
                      </div>
                      {canBuy ? <Check className="h-5 w-5 text-success" /> : <Cross className="h-5 w-5 text-danger" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <Card title="Amuletos y reliquias" iconId="churchAmulet">
            <div className="grid gap-3 sm:grid-cols-2">
              {inventoryRows.map(({ itemId, buyPrice, stock, item }) => {
                const canBuy = soldier.coins >= buyPrice && stock > 0;
                return (
                  <Tooltip key={itemId} type="item" itemId={itemId}>
                    <article className="border border-iron bg-background/35 p-3">
                      <div className="flex gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-gold/25 bg-black/35">
                          <Image
                            src={getItemImagePath(itemId)}
                            alt=""
                            width={96}
                            height={96}
                            className="h-14 w-14 object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-cinzel text-base font-extrabold uppercase text-gold-soft">
                            {item?.name ?? itemId}
                          </h3>
                          <div className="mt-2 flex items-center gap-2">
                            <UiAssetIcon id="coins" label="Doblones" className="h-5 w-5" />
                            <span className="font-mono text-xs uppercase text-gold">{buyPrice}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canBuy}
                        onClick={() => {
                          const result = buyChurchItem(itemId);
                          if (result.ok) playCoinSound();
                          else playDefeatSound();
                          showNotice(result.message, !result.ok);
                        }}
                        className="mt-3 iron-button w-full px-3 py-2 text-xs disabled:opacity-45"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                    </article>
                  </Tooltip>
                );
              })}
            </div>
          </Card>

          <PlayerChestPanel
            items={laidOutInventory}
            equipment={soldier.equipment}
            activeChest={activeChest}
            activeChestCells={activeChestCells}
            selectedItemId={null}
            draggingItemId={null}
            isOverBackpack={false}
            readOnly
            onChestChange={setActiveChest}
            onSelectItem={() => undefined}
            onDragStart={() => undefined}
            onDragEnd={() => undefined}
            onDragOverBackpack={() => undefined}
            onDragLeaveBackpack={() => undefined}
            onDropBackpack={() => undefined}
            onCellDrop={() => undefined}
          />
        </div>
      </div>
    </PageTransition>
  );
}
