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
  type AuctionView,
} from "@/lib/actions/market";
import type { ActionResult } from "@/lib/domain/result";
import type { GameState } from "@/lib/types";
import { getItem, getItemImagePath } from "@/lib/game-data";
import { Tooltip } from "@/components/ui/tooltip";
import { rarityStyle, rarityLabel } from "@/lib/item-format";
import { SYSTEM_AUCTION_PLAN, SYSTEM_AUCTION_REFRESH_HOURS } from "@/lib/data/system-auctions";

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
  const [activeTab, setActiveTab] = useState<"system" | "p2p" | "history">("system");

  const sellableItems = useMemo(
    () => soldier.inventory.filter((item) => item.quantity > 0),
    [soldier.inventory],
  );

  const effectiveSelectedItemId = selectedItemId || sellableItems[0]?.itemId || "";

  const refreshAuctions = async () => {
    const response = await fetch("/api/market/auctions", { cache: "no-store" });
    const result = (await response.json()) as ActionResult<{ auctions: AuctionView[] }>;
    if (result.ok && result.data) setAuctions(result.data.auctions);
    else setNotice(result.message);
  };

  const placeBid = async (listingId: string, amount: number) => {
    const response = await fetch("/api/market/bid", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listingId, amount }),
    });
    return (await response.json()) as ActionResult<{ state: GameState }>;
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

  // Filter lists
  const systemAuctions = useMemo(() => {
    return auctions.filter((a) => a.isSystem && a.status === "active");
  }, [auctions]);

  const p2pAuctions = useMemo(() => {
    return auctions.filter((a) => !a.isSystem && a.status === "active");
  }, [auctions]);

  const myBids = useMemo(() => {
    return auctions.filter((a) => a.isWinning || (a.isMine && !a.isSystem));
  }, [auctions]);
  const winningSystemAuctions = systemAuctions.filter((auction) => auction.isWinning).length;

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
        {/* Header */}
        <header className="page-header">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="cityHouseOfTrade" label="Lonja" className="h-10 w-10" />
            <div>
              <p className="page-header__eyebrow">Pregones y pujas</p>
              <h1 className="page-header__title">Lonja de la Villa</h1>
              <p className="page-header__subtitle">Adquiere pertrechos de la compañía o comercia con otros soldados.</p>
            </div>
          </div>
          <div className="font-mono text-xs uppercase text-gold">{soldier.coins} doblones</div>
        </header>

        {notice && (
          <div role="status" className="notice notice--ok font-mono text-xs border border-iron bg-stone-900/60 p-2.5 rounded-xs">
            {notice}
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex gap-1.5 border-b border-iron/50 pb-px">
          <button
            type="button"
            onClick={() => {
              setActiveTab("system");
              setNotice(null);
            }}
            className={`font-cinzel text-xs uppercase tracking-wider px-4 py-2 border-t border-x rounded-t-sm transition-all -mb-px flex items-center gap-2 ${
              activeTab === "system"
                ? "bg-panel border-iron border-b-background text-gold font-bold"
                : "bg-stone-950/40 border-transparent text-text-muted hover:text-text hover:bg-stone-900/25"
            }`}
          >
            <UiAssetIcon id="cityHouseOfTrade" label="" className="h-3.5 w-3.5" />
            Subastas del Tercio
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("p2p");
              setNotice(null);
            }}
            className={`font-cinzel text-xs uppercase tracking-wider px-4 py-2 border-t border-x rounded-t-sm transition-all -mb-px flex items-center gap-2 ${
              activeTab === "p2p"
                ? "bg-panel border-iron border-b-background text-gold font-bold"
                : "bg-stone-950/40 border-transparent text-text-muted hover:text-text hover:bg-stone-900/25"
            }`}
          >
            <UiAssetIcon id="inventory" label="" className="h-3.5 w-3.5" />
            Mercado de Soldados
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              setNotice(null);
            }}
            className={`font-cinzel text-xs uppercase tracking-wider px-4 py-2 border-t border-x rounded-t-sm transition-all -mb-px flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-panel border-iron border-b-background text-gold font-bold"
                : "bg-stone-950/40 border-transparent text-text-muted hover:text-text hover:bg-stone-900/25"
            }`}
          >
            <UiAssetIcon id="battleReports" label="" className="h-3.5 w-3.5" />
            Mis Pujas y Historial
            {myBids.some((a) => a.status !== "active" && !a.winnerClaimedAt && !a.sellerClaimedAt) && (
              <span className="h-2 w-2 rounded-full bg-blood-bright animate-pulse" />
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="bg-panel border-x border-b border-iron p-4 rounded-b-xs space-y-4">
          
          {/* TAB 1: SYSTEM AUCTIONS */}
          {activeTab === "system" && (
            <div className="space-y-4">
              {systemAuctions.length > 0 && (
                <div className="grid gap-3 border border-iron bg-stone-950/65 p-3 rounded-xs lg:grid-cols-[1fr_auto]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <UiAssetIcon id="battleReports" label="Reloj" className="h-6 w-6 text-gold-soft" />
                      <div>
                        <span className="font-cinzel text-sm font-bold uppercase tracking-wider text-gold-soft">
                          Intendencia militar
                        </span>
                        <p className="text-[10px] text-text-muted">
                          Ciclo fijo de {SYSTEM_AUCTION_REFRESH_HOURS}h. La puja alta al cierre recibe carta en el buzon con el adjunto.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SYSTEM_AUCTION_PLAN.map((slot) => (
                        <span key={slot.id} className="border border-iron/60 bg-background/55 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-text-muted rounded-xs">
                          {slot.count} {slot.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid min-w-56 gap-1.5 border border-gold/25 bg-background/75 p-3 text-right rounded-xs">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">Ciclo activo</span>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-gold">Lotes abiertos</span>
                    <span className="font-mono text-[9px] uppercase text-text-muted">
                      {systemAuctions.length} lotes - {winningSystemAuctions} ganando
                    </span>
                  </div>
                </div>
              )}
              {/* Global Timer */}
              {false && systemAuctions.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 border border-iron bg-stone-950/65 px-4 py-2.5 rounded-xs">
                  <div className="flex items-center gap-2.5">
                    <UiAssetIcon id="battleReports" label="Reloj" className="h-5 w-5 text-gold-soft" />
                    <div>
                      <span className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold-soft">
                        Lotes de la Intendencia Militar
                      </span>
                      <p className="text-[10px] text-text-muted">
                        Subastas oficiales de intendencia. La puja máxima al final del ciclo se lleva el pertrecho.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid of items */}
              {systemAuctions.length === 0 ? (
                <div className="border border-dashed border-iron/60 p-8 text-center font-mono text-xs uppercase text-text-muted">
                  No hay lotes de intendencia abiertos en este momento. Refrescando...
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {systemAuctions.map((auction) => {
                    const item = getItem(auction.itemId);
                    const style = rarityStyle(item?.rarity);
                    const currentPrice = auction.currentBid ?? auction.startingBid;
                    const nextBid = currentPrice + 1;
                    return (
                      <div key={auction.id} className={`game-panel p-3 border ${style.ring} ${style.bg} flex min-h-[248px] flex-col justify-between hover:border-gold/30 transition-all rounded-xs relative group`}>
                        <div>
                          {/* Item Card Header */}
                          <div className="flex gap-3 mb-3">
                            <Tooltip type="item" itemId={auction.itemId}>
                              <div className="relative h-14 w-14 border border-iron/80 bg-stone-950 p-1 shrink-0 cursor-help flex items-center justify-center rounded-xs group-hover:border-gold/45 transition-colors">
                                <img src={getItemImagePath(auction.itemId)} alt={auction.itemName} className="max-h-full max-w-full object-contain" />
                              </div>
                            </Tooltip>
                            <div className="min-w-0 flex-1">
                              <h3 className={`font-cinzel text-xs font-bold uppercase truncate ${style.color} tracking-wider`} title={auction.itemName}>
                                {auction.itemName}
                              </h3>
                              <p className="text-[9px] text-text-muted font-mono uppercase mt-0.5">
                                {rarityLabel(item?.rarity)}
                              </p>
                              <p className="text-[9px] text-gold-soft font-mono mt-0.5 uppercase tracking-wide">
                                {item?.slot ?? "pertrecho"}
                              </p>
                            </div>
                          </div>

                          {/* Stats summary */}
                          <div className="bg-stone-950/60 border border-iron/20 p-2 rounded-xs space-y-1 text-[11px] font-mono mb-3">
                            <div className="flex justify-between items-baseline">
                              <span className="text-text-muted text-[10px] uppercase">Puja Inicial:</span>
                              <span className="text-text">{auction.startingBid} <span className="text-gold text-[9px]">oro</span></span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-text-muted text-[10px] uppercase">Puja Actual:</span>
                              <span className="text-text font-bold">{currentPrice} <span className="text-gold text-[9px]">oro</span></span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-text-muted text-[10px] uppercase">Pujador:</span>
                              {auction.isWinning ? (
                                <span className="text-success font-bold uppercase text-[10px] tracking-wider">¡Llevas la puja!</span>
                              ) : auction.currentBidderName ? (
                                <span className="text-ember font-bold truncate max-w-[110px]" title={auction.currentBidderName}>
                                  {auction.currentBidderName}
                                </span>
                              ) : (
                                <span className="text-text-muted text-[10px] uppercase">Nadie</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bid controls */}
                        <div className="pt-2 border-t border-iron/20 mt-auto">
                          <div className="flex gap-1.5 items-stretch">
                            <input
                              type="number"
                              min={nextBid}
                              value={bids[auction.id] ?? nextBid}
                              onChange={(event) => setBids((current) => ({ ...current, [auction.id]: Number(event.target.value) }))}
                              className="field min-w-0 flex-1 text-center py-1 text-xs font-mono"
                              disabled={busy || auction.isWinning}
                            />
                            <button
                              type="button"
                              className="blood-button px-4 py-1 text-[10px] font-cinzel font-bold uppercase tracking-wider shrink-0"
                              disabled={busy || auction.isWinning}
                              onClick={() =>
                                void run(async () => {
                                  const result = await placeBid(auction.id, bids[auction.id] ?? nextBid);
                                  setNotice(result.message);
                                  if (result.ok && result.data) hydrateState(result.data.state);
                                })
                              }
                            >
                              Pujar
                            </button>
                          </div>
                          {auction.isWinning && (
                            <p className="text-[9px] text-success text-center mt-1.5 font-sans">
                              Mantienes la puja ganadora.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: P2P AUCTIONS */}
          {activeTab === "p2p" && (
            <div className="space-y-4">
              {/* Sell form */}
              <section className="border border-iron/60 bg-stone-950/20 p-3 rounded-xs">
                <div className="mb-3 flex items-center gap-2 border-b border-iron/40 pb-2">
                  <UiAssetIcon id="inventory" label="Vender" className="h-5 w-5 text-gold" />
                  <h2 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold">Publicar lote en el mercado</h2>
                </div>
                <div className="grid gap-2 md:grid-cols-[1fr_120px_120px_auto]">
                  <select
                    value={selectedItemId}
                    onChange={(event) => setSelectedItemId(event.target.value)}
                    className="field text-xs"
                    disabled={busy || sellableItems.length === 0}
                  >
                    {sellableItems.length === 0 ? (
                      <option value="">No tienes objetos para subastar</option>
                    ) : (
                      sellableItems.map((item) => (
                        <option key={item.itemId} value={item.itemId}>
                          {getItem(item.itemId)?.name ?? item.itemId} x{item.quantity}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={startingBid}
                      onChange={(event) => setStartingBid(Number(event.target.value))}
                      className="field text-xs w-full pr-7 font-mono"
                      placeholder="Puja inicial"
                      disabled={busy}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-text-muted uppercase font-mono">oro</span>
                  </div>
                  <select
                    value={durationHours}
                    onChange={(event) => setDurationHours(Number(event.target.value) as 2 | 8 | 24)}
                    className="field text-xs"
                    disabled={busy}
                  >
                    <option value={2}>2 horas (Tasa 2%)</option>
                    <option value={8}>8 horas (Tasa 2%)</option>
                    <option value={24}>24 horas (Tasa 2%)</option>
                  </select>
                  <button
                    type="button"
                    className="blood-button px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider"
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
                    Pregonar
                  </button>
                </div>
              </section>

              {/* P2P Listings */}
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-iron/40 pb-1.5">
                  <h2 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold-soft">Lotes de otros Soldados</h2>
                  <button type="button" className="iron-button px-3 py-1 text-[9px] font-mono uppercase font-bold" disabled={busy} onClick={() => void refreshAuctions()}>
                    Refrescar
                  </button>
                </div>
                <div className="space-y-2">
                  {p2pAuctions.length === 0 ? (
                    <div className="border border-dashed border-iron/50 p-6 text-center font-mono text-xs uppercase text-text-muted rounded-xs">
                      No hay pregones de otros soldados en la villa actualmente.
                    </div>
                  ) : (
                    p2pAuctions.map((auction) => (
                      <div key={auction.id} className="grid gap-2 border border-iron/60 bg-stone-950/35 p-2 md:grid-cols-[52px_1fr_120px_180px] items-center rounded-xs hover:bg-stone-900/10 transition-colors">
                        <Tooltip type="item" itemId={auction.itemId}>
                          <div className="h-12 w-12 border border-iron bg-stone-950 p-1 flex items-center justify-center cursor-help rounded-xs">
                            <img src={getItemImagePath(auction.itemId)} alt={auction.itemName} className="max-h-full max-w-full object-contain" />
                          </div>
                        </Tooltip>
                        <div className="min-w-0">
                          <div className="truncate font-cinzel text-sm font-bold uppercase text-gold-soft">{auction.itemName}</div>
                          <div className="font-mono text-[9px] uppercase text-text-muted flex items-center gap-1">
                            Estado: <span className="font-bold text-gold">Activa</span>
                          </div>
                        </div>
                        <div className="font-mono text-xs text-text">
                          Puja: <span className="font-bold text-text-muted">{auction.currentBid ?? auction.startingBid}</span> <span className="text-gold text-[10px]">oro</span>
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            min={(auction.currentBid ?? auction.startingBid) + 1}
                            value={bids[auction.id] ?? ((auction.currentBid ?? auction.startingBid) + 1)}
                            onChange={(event) => setBids((current) => ({ ...current, [auction.id]: Number(event.target.value) }))}
                            className="field min-w-0 text-center py-1 text-xs font-mono"
                            disabled={busy || auction.isMine || auction.isWinning}
                          />
                          <button
                            type="button"
                            className="blood-button px-3 text-[10px] font-bold font-cinzel uppercase tracking-wider"
                            disabled={busy || auction.isMine || auction.isWinning}
                            onClick={() =>
                              void run(async () => {
                                const result = await placeBid(auction.id, bids[auction.id] ?? ((auction.currentBid ?? auction.startingBid) + 1));
                                setNotice(result.message);
                                if (result.ok && result.data) hydrateState(result.data.state);
                              })
                            }
                          >
                            Pujar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: HISTORY & CLAIMS */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-iron/40 pb-1.5">
                <h2 className="font-cinzel text-xs font-bold uppercase tracking-wider text-gold">Historial de pujas y pertenencias</h2>
                <button type="button" className="iron-button px-3 py-1 text-[9px] font-mono uppercase font-bold" disabled={busy} onClick={() => void refreshAuctions()}>
                  Refrescar
                </button>
              </div>

              {myBids.length === 0 ? (
                <div className="border border-dashed border-iron/50 p-8 text-center font-mono text-xs uppercase text-text-muted rounded-xs">
                  No participas en ninguna subasta activa ni tienes lotes concluidos pendientes de cobro.
                </div>
              ) : (
                <div className="space-y-3">
                  {myBids.map((auction) => {
                    const hasEnded = new Date(auction.endsAt).getTime() <= Date.now() || auction.status !== "active";
                    const isWinner = auction.isWinning;

                    return (
                      <div key={auction.id} className="border border-iron/50 bg-stone-950/40 p-3 rounded-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                          <Tooltip type="item" itemId={auction.itemId}>
                            <div className="h-11 w-11 border border-iron bg-stone-950 p-1 flex items-center justify-center cursor-help rounded-xs">
                              <img src={getItemImagePath(auction.itemId)} alt={auction.itemName} className="max-h-full max-w-full object-contain" />
                            </div>
                          </Tooltip>
                          <div>
                            <div className="font-cinzel text-xs font-bold uppercase text-gold-soft">{auction.itemName}</div>
                            <div className="text-[10px] text-text-muted font-mono mt-0.5">
                              {auction.isSystem ? "Subasta de Intendencia" : "Subasta de Soldado"} · {hasEnded ? "Concluida" : "Activa"}
                            </div>
                          </div>
                        </div>

                        {/* Status detail */}
                        <div className="font-mono text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
                          <div>
                            <span className="text-text-muted uppercase text-[9px] block">Tu puja</span>
                            <span className="font-bold text-text">{auction.currentBid} oro</span>
                          </div>
                          <div>
                            <span className="text-text-muted uppercase text-[9px] block">Estado</span>
                            {hasEnded ? (
                              isWinner ? (
                                <span className="text-success font-bold uppercase text-[9px] tracking-wider animate-pulse">¡Ganada!</span>
                              ) : (
                                <span className="text-danger uppercase text-[9px]">Perdida</span>
                              )
                            ) : isWinner ? (
                              <span className="text-success uppercase text-[9px]">Vas ganando</span>
                            ) : (
                              <span className="text-danger uppercase text-[9px]">Superada</span>
                            )}
                          </div>
                        </div>

                        {/* Claim action */}
                        <div>
                          {hasEnded && isWinner && (
                            <button
                              type="button"
                              className="blood-button px-4 py-1.5 text-[10px] font-cinzel font-bold uppercase tracking-wider animate-pulse"
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  const result = await claimAuctionAction({ listingId: auction.id });
                                  setNotice(result.message);
                                  if (result.ok && result.data) hydrateState(result.data.state);
                                })
                              }
                            >
                              Reclamar Pertrecho
                            </button>
                          )}
                          {hasEnded && auction.isMine && !auction.isSystem && (
                            <button
                              type="button"
                              className="iron-button px-4 py-1.5 text-[10px] font-cinzel font-bold uppercase tracking-wider"
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  const result = await claimAuctionAction({ listingId: auction.id });
                                  setNotice(result.message);
                                  if (result.ok && result.data) hydrateState(result.data.state);
                                })
                              }
                            >
                              {auction.status === "sold" ? "Cobrar Doblones" : "Recuperar Objeto"}
                            </button>
                          )}
                          {!hasEnded && (
                            <div className="text-[10px] text-text-muted font-mono uppercase bg-stone-900/60 border border-iron/30 px-2 py-1 rounded-xs">
                              En curso...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
