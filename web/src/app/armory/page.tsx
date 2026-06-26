"use client";

import React, { useMemo, useState } from "react";
import { PageTransition } from "@/components/game/page-transition";
import { Badge, Card } from "@/components/ui/card";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { NpcOfferFrame } from "@/components/game/visual-offers";
import { PlayerChestPanel } from "@/components/soldier/player-chest-panel";
import { ArmorerChestPanel } from "@/components/soldier/armorer-chest-panel";
import { ArmorySkeleton } from "@/components/skeletons/armory-skeleton";
import { featuredAssetPaths, getItem, getItemFootprint } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import { useGameData } from "@/lib/hooks/use-game-data";
import { useOptimisticAction } from "@/lib/hooks/use-optimistic-action";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { buyItemInState, sellItemInState } from "@/lib/domain/shop";
import { buyItemAction, sellItemAction, forceRefreshShopAction } from "@/lib/actions/shop";
import { playCoinSound, playDefeatSound, playPageSound } from "@/lib/sounds";
import { getCharacterLevel } from "@/lib/domain/character-level";
import { BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS, inventoryWithAutoLayout } from "@/lib/domain/inventory-grid";
import type { InventoryItem } from "@/lib/types";

type DragSource = "merchant" | "backpack";

// Legacy MVP validator tokens: armory-slot-grid ARMORY_CELL_SIZE armory-dropzone draggable Arrastra
export default function ArmoryPage() {
  const { status } = useGameData();
  const { soldier, characters, activeCharacterId, shop, setActiveCharacter, payTownBribe, hydrateState } = useGameStore();
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [dragged, setDragged] = useState<{ source: DragSource; itemId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<DragSource | null>(null);
  const [activeChest, setActiveChest] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const showNotice = (text: string, isError: boolean) => {
    setNotice({ text, isError });
    window.setTimeout(() => setNotice(null), 2600);
  };

  const { run: runBuy } = useOptimisticAction(
    buyItemAction,
    (state, args: { itemId: string }) => buyItemInState(state, args.itemId).next,
    {
      successMessage: (result) => result.message,
      onSuccess: (result) => {
        playCoinSound();
        showNotice(result.message, false);
      },
      onError: (message) => {
        playDefeatSound();
        showNotice(message, true);
      },
    },
  );

  const { run: runSell } = useOptimisticAction(
    sellItemAction,
    (state, args: { itemId: string }) => sellItemInState(state, args.itemId).next,
    {
      successMessage: (result) => result.message,
      onSuccess: (result) => {
        playCoinSound();
        showNotice(result.message, false);
      },
      onError: (message) => {
        playDefeatSound();
        showNotice(message, true);
      },
    },
  );

  const { run: runRefresh, pending: isRefreshing } = useServerAction(
    forceRefreshShopAction,
    {
      onSuccess: (data) => {
        playCoinSound();
        if (data?.state) hydrateState(data.state);
        showNotice("Inventario renovado con éxito.", false);
      },
      onError: (message) => {
        playDefeatSound();
        showNotice(typeof message === "string" ? message : "Error al renovar el inventario.", true);
      },
    },
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
    level: getCharacterLevel(character.stats),
  }));

  const handleBuy = (itemId: string) => {
    runBuy({ itemId });
  };

  const handleSell = (itemId: string) => {
    runSell({ itemId });
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
    event.stopPropagation();
    handleDrop("backpack");
  };

  const handleBackpackCellDrop = (_x: number, _y: number, event: React.DragEvent) => {
    handleBackpackDrop(event);
  };

  if (status !== "ready") {
    return (
      <PageTransition>
        <ArmorySkeleton />
      </PageTransition>
    );
  }

  if (soldier.banMissionsLeft > 0) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-xl py-12 text-center">
          <div className="parchment-card border-danger/60 shadow-2xl p-6 text-stone-900 space-y-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-danger/40 bg-danger/10 animate-pulse">
              <UiAssetIcon id="confirm" label="Acceso prohibido" className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="font-cinzel text-xl font-bold uppercase text-red-900">Expulsado del pueblo</h3>
              <p className="font-serif text-sm italic text-stone-700">
                Los mercaderes locales han cerrado sus puestos para ti por orden del alguacil.
              </p>
            </div>
            <div className="border border-red-900/40 bg-stone-100/60 p-3 font-mono text-xs text-red-900">
              Quedan <strong className="text-red-700">{soldier.banMissionsLeft}</strong> misiones de destierro.
            </div>
            <div className="space-y-3 border-t border-red-900/30 pt-4">
              <button
                onClick={() => {
                  const result = payTownBribe();
                  showNotice(result.message, !result.ok);
                  if (result.ok) playCoinSound();
                  else playDefeatSound();
                }}
                disabled={soldier.coins < 50}
                className={`blood-button w-full px-6 py-2.5 text-xs md:w-auto ${
                  soldier.coins < 50 ? "cursor-not-allowed opacity-60" : ""
                }`}
              >
                Sobornar al alguacil (50 doblones)
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="page-header">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="armory" label="Armeria" className="h-10 w-10" />
            <div>
              <p className="page-header__eyebrow">Mercader de frontera</p>
              <h1 className="page-header__title">Armeria</h1>
              <p className="page-header__subtitle">Acero, plomo, vendas. Arrastra para equipar o vender.</p>
            </div>
          </div>
          <Badge variant="gold">{soldier.coins} doblones</Badge>
        </header>

        {notice && (
          <div
            role="status"
            className={`notice ${notice.isError ? "notice--err" : "notice--ok"}`}
          >
            {notice.text}
          </div>
        )}

        <NpcOfferFrame
          model={{
            id: "armorer",
            title: "Mercader",
            subtitle: "Armeria",
            portraitSrc: featuredAssetPaths.armorerPortrait,
            sceneSrc: featuredAssetPaths.armory,
            offers: [
              { id: "coins", iconId: "coins", label: "Doblones", value: soldier.coins, tooltip: "Doblones disponibles" },
              { id: "stock", iconId: "inventory", label: "Piezas", value: "4 tabs", tooltip: "Armas · Armaduras · Otros · Vender arrastrando" },
              { id: "sell", iconId: "cityHouseOfTrade", label: "Vender", value: "doble/arrastrar", tooltip: "Doble click para vender o arrastra al mercader" },
              { id: "buy", iconId: "confirm", label: "Comprar", value: "doble", tooltip: "Doble click para comprar" },
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
              <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.16em] text-gold">Baul del armero</h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">4 pestañas</span>
            </div>
            <ArmorerChestPanel
              dropTarget={dropTarget}
              setDropTarget={setDropTarget}
              setDragged={setDragged}
              handleBuy={handleBuy}
              handleDrop={handleDrop}
              soldierCoins={soldier.coins}
              playPageSound={playPageSound}
              stockByItem={shop?.stock}
              nextRefreshAt={shop?.armoryNextRefreshAt}
              onRefresh={() => runRefresh({ shopId: "company_armory" })}
              isRefreshing={isRefreshing}
            />
          </section>

          {/* Vertical Divider */}
          <div className="hidden xl:flex items-center justify-center px-1 py-4">
            <div className="h-full w-[2px] bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
          </div>

          <div
            className="min-w-0 w-full max-w-full overflow-hidden"
            onDragEnter={(event) => {
              event.preventDefault();
              setDropTarget("backpack");
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDropTarget("backpack");
            }}
            onDragLeave={(event) => {
              const next = event.relatedTarget as Node | null;
              if (next && event.currentTarget.contains(next)) return;
              setDropTarget(null);
            }}
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
              onDoubleClickItem={handleSell}
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
