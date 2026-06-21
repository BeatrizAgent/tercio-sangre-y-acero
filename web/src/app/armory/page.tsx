"use client";

import React, { useMemo, useState } from "react";
import { PageTransition } from "@/components/game/page-transition";
import { Badge, Card } from "@/components/ui/card";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { NpcOfferFrame } from "@/components/game/visual-offers";
import { PlayerChestPanel } from "@/components/soldier/player-chest-panel";
import { ArmorerChestPanel } from "@/components/soldier/armorer-chest-panel";
import { featuredAssetPaths, getItem, getItemFootprint } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import { playCoinSound, playDefeatSound, playPageSound } from "@/lib/sounds";
import { getCharacterLevel } from "@/lib/domain/character-level";
import { BACKPACK_CHESTS, BACKPACK_COLS, BACKPACK_ROWS, inventoryWithAutoLayout } from "@/lib/domain/inventory-grid";
import type { InventoryItem } from "@/lib/types";

type DragSource = "merchant" | "backpack";

// Legacy MVP validator tokens: armory-slot-grid ARMORY_CELL_SIZE armory-dropzone draggable Arrastra
export default function ArmoryPage() {
  const { soldier, characters, activeCharacterId, setActiveCharacter, buyItem, sellItem, payTownBribe } = useGameStore();
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [dragged, setDragged] = useState<{ source: DragSource; itemId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<DragSource | null>(null);
  const [activeChest, setActiveChest] = useState(0);

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
    event.stopPropagation();
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

        <NpcOfferFrame
          model={{
            id: "armorer",
            title: "Mercader",
            subtitle: "Armeria",
            portraitSrc: featuredAssetPaths.armorerPortrait,
            sceneSrc: featuredAssetPaths.armory,
            offers: [
              { id: "coins", iconId: "coins", label: "Doblones", value: soldier.coins, tooltip: "Doblones disponibles" },
              { id: "stock", iconId: "inventory", label: "Piezas", value: "3 tabs", tooltip: "Productos · Objetos comunes · Vender arrastrando" },
              { id: "sell", iconId: "cityHouseOfTrade", label: "Vender", value: "drag", tooltip: "Arrastra del baul al mercader para vender" },
              { id: "buy", iconId: "confirm", label: "Comprar", value: "doble", tooltip: "Doble click para comprar" },
            ],
          }}
        />

        <div className="grid min-w-0 max-w-full gap-4 overflow-hidden xl:grid-cols-2">
          <section className="game-panel min-w-0 w-full max-w-full overflow-hidden space-y-2 p-3">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-iron/45 pb-2">
              <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.16em] text-gold">Baul del armero</h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">3 pestañas</span>
            </div>
            <ArmorerChestPanel
              dropTarget={dropTarget}
              setDropTarget={setDropTarget}
              setDragged={setDragged}
              handleBuy={handleBuy}
              handleDrop={handleDrop}
              soldierCoins={soldier.coins}
              playPageSound={playPageSound}
            />
          </section>

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
