"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageTransition } from "@/components/game/page-transition";
import { Badge } from "@/components/ui/card";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { NpcOfferFrame } from "@/components/game/visual-offers";
import { PlayerChestPanel } from "@/components/soldier/player-chest-panel";
import { ChaplainChestPanel } from "@/components/soldier/chaplain-chest-panel";
import { ChurchSkeleton } from "@/components/skeletons/church-skeleton";
import { BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS, inventoryWithAutoLayout } from "@/lib/domain/inventory-grid";
import {
  assetPath,
  churchBlessings,
  churchInventory,
  featuredAssetPaths,
  getItem,
  getItemFootprint,
} from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { forceRefreshShopAction } from "@/lib/actions/shop";
import { playCoinSound, playDefeatSound, playPageSound } from "@/lib/sounds";
import { getCharacterLevel } from "@/lib/domain/character-level";
import type { InventoryItem } from "@/lib/types";

type DragSource = "merchant" | "backpack";

export default function ChurchPage() {
  const { status } = useGameData();
  const {
    soldier,
    characters,
    activeCharacterId,
    setActiveCharacter,
    buyChurchBlessing,
    buyChurchItem,
    donateItem,
    payChurchErrand,
    shop,
    hydrateState,
  } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [dragged, setDragged] = useState<{ source: DragSource; itemId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<DragSource | null>(null);
  const [activeChest, setActiveChest] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { run: runRefresh, pending: isRefreshing } = useServerAction(
    forceRefreshShopAction,
    {
      onSuccess: (data) => {
        playCoinSound();
        if (data?.state) hydrateState(data.state);
        setNotice({ text: "Inventario renovado con éxito.", isError: false });
        window.setTimeout(() => setNotice(null), 2600);
      },
      onError: (message) => {
        playDefeatSound();
        setNotice({ text: typeof message === "string" ? message : "Error al renovar el relicario.", isError: true });
        window.setTimeout(() => setNotice(null), 2600);
      },
    },
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const laidOutInventory = useMemo<InventoryItem[]>(
    () => inventoryWithAutoLayout(soldier.inventory, BACKPACK_COLS, BACKPACK_ROWS, BACKPACK_CHESTS),
    [soldier.inventory],
  );

  if (!mounted || status !== "ready") {
    return (
      <PageTransition>
        <ChurchSkeleton />
      </PageTransition>
    );
  }

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
    level: getCharacterLevel(character.stats),
  }));

  const showNotice = (text: string, isError: boolean) => {
    setNotice({ text, isError });
    window.setTimeout(() => setNotice(null), 2600);
  };

  const handleBuyBlessing = (blessingId: string) => {
    const result = buyChurchBlessing(blessingId);
    if (result.ok) {
      playCoinSound();
      showNotice(result.message, false);
    } else {
      playDefeatSound();
      showNotice(result.message, true);
    }
    return result;
  };

  const handleBuyChurchItem = (itemId: string) => {
    const result = buyChurchItem(itemId);
    if (result.ok) {
      playCoinSound();
      showNotice(result.message, false);
    } else {
      playDefeatSound();
      showNotice(result.message, true);
    }
    return result;
  };

  const handleDonate = (itemId: string) => {
    const result = donateItem(itemId);
    if (result.ok) {
      playCoinSound();
      showNotice(result.message, false);
    } else {
      playDefeatSound();
      showNotice(result.message, true);
    }
    return result;
  };

  const handlePayErrand = (cost: number) => {
    const result = payChurchErrand(cost);
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
    if (dragged.source === "backpack" && target === "merchant") handleDonate(dragged.itemId);
    setDragged(null);
    setDropTarget(null);
  };

  const handleBackpackDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragged(null);
    setDropTarget(null);
  };

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
              { id: "relics", iconId: "churchAmulet", label: "Reliquias", value: churchInventory.length, tooltip: "Amuletos en venta" },
            ],
          }}
        />

        <div className="grid min-w-0 max-w-full gap-4 overflow-hidden xl:grid-cols-[1fr_auto_1fr]">
          <section
            className={`game-panel min-w-0 w-full max-w-full overflow-hidden space-y-2 p-3 transition-all ${
              dropTarget === "merchant" ? "ring-2 ring-gold/40" : ""
            }`}
            onDragEnter={(event) => {
              if (dragged?.source === "backpack") {
                event.preventDefault();
                setDropTarget("merchant");
              }
            }}
            onDragOver={(event) => {
              if (dragged?.source === "backpack") {
                event.preventDefault();
                setDropTarget("merchant");
              }
            }}
            onDragLeave={(event) => {
              const next = event.relatedTarget as Node | null;
              if (next && event.currentTarget.contains(next)) return;
              setDropTarget(null);
            }}
            onDrop={(event) => {
              if (dragged?.source === "backpack") {
                event.preventDefault();
                event.stopPropagation();
                handleDrop("merchant");
              }
            }}
          >
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-iron/45 pb-2">
              <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.16em] text-gold">Baul del capellan</h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">4 pestañas</span>
            </div>
            <ChaplainChestPanel
              dropTarget={dropTarget}
              setDropTarget={setDropTarget}
              handleDrop={handleDrop}
              handleBuyBlessing={handleBuyBlessing}
              handleBuyChurchItem={handleBuyChurchItem}
              handlePayErrand={handlePayErrand}
              soldierCoins={soldier.coins}
              playPageSound={playPageSound}
              stockByItem={shop?.stock}
              nextRefreshAt={shop?.churchNextRefreshAt}
              onRefresh={() => runRefresh({ shopId: "field_church" })}
              isRefreshing={isRefreshing}
            />
          </section>

          {/* Vertical Divider */}
          <div className="hidden xl:flex items-center justify-center px-1 py-4">
            <div className="h-full w-[2px] bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
          </div>

          <div
            className="min-w-0 w-full max-w-full overflow-hidden"
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
              selectedItemId={selectedItemId}
              draggingItemId={dragged?.itemId ?? null}
              isOverBackpack={dropTarget === "backpack"}
              onChestChange={(idx) => {
                playPageSound();
                setActiveChest(idx);
              }}
              onSelectItem={(id) => {
                playPageSound();
                setSelectedItemId(id);
              }}
              onDoubleClickItem={handleDonate}
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
              onCellDrop={(_x, _y, event) => handleBackpackDrop(event)}
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
