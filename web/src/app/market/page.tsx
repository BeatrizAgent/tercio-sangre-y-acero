"use client";

import { useEffect, useMemo, useState } from "react";
import { PageTransition } from "@/components/game/page-transition";
import { MarketSkeleton } from "@/components/skeletons/market-skeleton";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { useGameData } from "@/lib/hooks/use-game-data";
import { useGameStore } from "@/lib/game-store";
import {
  claimAuctionAction,
  createAuctionListingAction,
  listAuctionsAction,
  placeAuctionBidAction,
  type AuctionView,
} from "@/lib/actions/market";
import { getItem, getItemImagePath } from "@/lib/game-data";

export default function MarketPage() {
  const { status } = useGameData();
  const { soldier, hydrateState } = useGameStore();
  const [auctions, setAuctions] = useState<AuctionView[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [startingBid, setStartingBid] = useState(10);
  const [durationHours, setDurationHours] = useState<2 | 8 | 24>(2);
  const [bids, setBids] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sellableItems = useMemo(
    () => soldier.inventory.filter((item) => item.quantity > 0),
    [soldier.inventory],
  );

  const effectiveSelectedItemId = selectedItemId || sellableItems[0]?.itemId || "";

  const refreshAuctions = async () => {
    const result = await listAuctionsAction();
    if (result.ok && result.data) setAuctions(result.data.auctions);
    else setNotice(result.message);
  };

  useEffect(() => {
    if (status !== "ready") return;
    const timer = window.setTimeout(() => void refreshAuctions(), 0);
    return () => window.clearTimeout(timer);
  }, [status]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setNotice(null);
    try {
      await work();
      await refreshAuctions();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Orden rechazada por la lonja.");
    } finally {
      setBusy(false);
    }
  };

  if (status !== "ready") {
    return (
      <PageTransition>
        <MarketSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="page-header">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="cityHouseOfTrade" label="Lonja" className="h-10 w-10" />
            <div>
              <p className="page-header__eyebrow">Pregones y pujas</p>
              <h1 className="page-header__title">Subasta</h1>
              <p className="page-header__subtitle">Puja, vende pertrechos y vuelve cuando cierre el lote.</p>
            </div>
          </div>
          <div className="font-mono text-xs uppercase text-gold">{soldier.coins} doblones</div>
        </header>

        {notice && (
          <div role="status" className="notice notice--ok">
            {notice}
          </div>
        )}

        <section className="game-panel p-3">
          <div className="mb-3 flex items-center gap-2 border-b border-iron/50 pb-2">
            <UiAssetIcon id="inventory" label="Vender" className="h-6 w-6" />
            <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.16em] text-gold">Poner lote</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_120px_120px_auto]">
            <select
              value={selectedItemId}
              onChange={(event) => setSelectedItemId(event.target.value)}
              className="field"
              disabled={busy || sellableItems.length === 0}
            >
              {sellableItems.map((item) => (
                <option key={item.itemId} value={item.itemId}>
                  {getItem(item.itemId)?.name ?? item.itemId} x{item.quantity}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={startingBid}
              onChange={(event) => setStartingBid(Number(event.target.value))}
              className="field"
              disabled={busy}
            />
            <select
              value={durationHours}
              onChange={(event) => setDurationHours(Number(event.target.value) as 2 | 8 | 24)}
              className="field"
              disabled={busy}
            >
              <option value={2}>2 horas</option>
              <option value={8}>8 horas</option>
              <option value={24}>24 horas</option>
            </select>
            <button
              type="button"
              className="blood-button px-4 py-2 text-xs"
              disabled={busy || !effectiveSelectedItemId}
              onClick={() =>
                void run(async () => {
                  const result = await createAuctionListingAction({
                    itemId: effectiveSelectedItemId,
                    startingBid,
                    durationHours,
                  });
                  setNotice(result.message);
                  if (result.ok && result.data) hydrateState(result.data.state);
                })
              }
            >
              Vender
            </button>
          </div>
        </section>

        <section className="game-panel p-3">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-iron/50 pb-2">
            <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.16em] text-gold">Lotes abiertos</h2>
            <button type="button" className="iron-button px-3 py-1 text-[10px]" disabled={busy} onClick={() => void refreshAuctions()}>
              Refrescar
            </button>
          </div>
          <div className="space-y-2">
            {auctions.map((auction) => (
              <div key={auction.id} className="grid gap-2 border border-iron/60 bg-stone-950/35 p-2 md:grid-cols-[52px_1fr_120px_180px]">
                <img src={getItemImagePath(auction.itemId)} alt="" className="h-12 w-12 object-contain" />
                <div className="min-w-0">
                  <div className="truncate font-cinzel text-sm font-bold uppercase text-gold-soft">{auction.itemName}</div>
                  <div className="font-mono text-[10px] uppercase text-text-muted">
                    {auction.status} · acaba {new Date(auction.endsAt).toLocaleString("es-ES", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </div>
                </div>
                <div className="font-mono text-xs uppercase text-text">
                  Puja {auction.currentBid ?? auction.startingBid}
                </div>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min={(auction.currentBid ?? auction.startingBid) + 1}
                    value={bids[auction.id] ?? ((auction.currentBid ?? auction.startingBid) + 1)}
                    onChange={(event) => setBids((current) => ({ ...current, [auction.id]: Number(event.target.value) }))}
                    className="field min-w-0"
                    disabled={busy || auction.status !== "active" || auction.isMine}
                  />
                  <button
                    type="button"
                    className="blood-button px-3 text-[10px]"
                    disabled={busy || auction.status !== "active" || auction.isMine}
                    onClick={() =>
                      void run(async () => {
                        const result = await placeAuctionBidAction({
                          listingId: auction.id,
                          amount: bids[auction.id] ?? ((auction.currentBid ?? auction.startingBid) + 1),
                        });
                        setNotice(result.message);
                        if (result.ok && result.data) hydrateState(result.data.state);
                      })
                    }
                  >
                    Pujar
                  </button>
                  <button
                    type="button"
                    className="iron-button px-3 text-[10px]"
                    disabled={busy || auction.status === "active" || (!auction.isMine && !auction.isWinning)}
                    onClick={() =>
                      void run(async () => {
                        const result = await claimAuctionAction({ listingId: auction.id });
                        setNotice(result.message);
                        if (result.ok && result.data) hydrateState(result.data.state);
                      })
                    }
                  >
                    Cobrar
                  </button>
                </div>
              </div>
            ))}
            {auctions.length === 0 && (
              <div className="border border-dashed border-iron/60 p-6 text-center font-mono text-xs uppercase text-text-muted">
                No hay pregones en la lonja.
              </div>
            )}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
