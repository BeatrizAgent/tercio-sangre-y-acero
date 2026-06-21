"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { CharacterPortrait } from "@/components/ui/character-portrait";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { VisualOfferGrid } from "@/components/game/visual-offers";
import { featuredAssetPaths, listArenaOpponents } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import type { ArenaOpponent } from "@/lib/types";

export default function ArenaPage() {
  const soldier = useGameStore((state) => state.soldier);
  const arenaResults = useGameStore((state) => state.arenaResults ?? []);
  const fightArenaOpponent = useGameStore((state) => state.fightArenaOpponent);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const opponents = listArenaOpponents();
  const wins = arenaResults.filter((result) => result.success).length;
  const losses = arenaResults.length - wins;
  const canFight = soldier.fatigue < 100;
  const leaderboardRows = [
    { name: soldier.name, score: wins * 3 + soldier.honor, active: true, portraitAssetId: "diego_retrato_serio" },
    ...opponents.map((opponent) => ({
      name: opponent.name,
      score: opponent.power + opponent.rewards.honor,
      active: false,
      portraitAssetId: opponent.portraitAssetId,
    })),
  ].sort((a, b) => b.score - a.score);

  const handleFight = (opponentId: string) => {
    const result = fightArenaOpponent(opponentId);
    setNotice({ text: result.message, ok: result.ok });
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-iron pb-3">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="arena" label="Arena" className="h-9 w-9" />
            <div>
              <h1 className="font-cinzel text-2xl font-extrabold uppercase tracking-wider text-gold md:text-3xl">Arena de la Taberna</h1>
              <p className="text-sm text-text-muted">Duelos locales contra rivales NPC. Sin espera real; solo fatiga, heridas y paga.</p>
            </div>
          </div>
          <Badge variant={canFight ? "gold" : "danger"}>{canFight ? "Lista para duelo" : "Agotado"}</Badge>
        </div>

        {notice && (
          <div className={`border px-4 py-2 font-mono text-sm ${notice.ok ? "border-success/40 bg-success/10 text-success" : "border-danger/40 bg-danger/10 text-danger"}`}>
            {notice.text}
          </div>
        )}

        <section className="scene-frame relative min-h-36 overflow-hidden rounded-sm border border-iron bg-stone-950">
          <img
            src={featuredAssetPaths.tavernTable}
            alt="Mesa de taberna preparada para duelos"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/92 via-background/50 to-background/88" />
          <div className="relative z-10 grid gap-2 p-3 md:grid-cols-4">
            <ArenaStat icon="honor" label="Marca" value={`${wins}V / ${losses}D`} />
            <ArenaStat icon="fatigue" label="Fatiga" value={`${soldier.fatigue}/100`} danger={soldier.fatigue >= 80} />
            <ArenaStat icon="coins" label="Doblones" value={`${soldier.coins}`} />
            <ArenaStat icon="wound" label="Heridas" value={`${soldier.wounds.filter((wound) => !wound.treated).length} abiertas`} danger={soldier.wounds.some((wound) => !wound.treated)} />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <Card title="Cartel de Rivales" iconId="arena">
            <div className="grid gap-3">
              {opponents.map((opponent) => {
                const isTooTired = soldier.fatigue + opponent.fatigue > 115;
                return (
                  <ArenaOpponentCard
                    key={opponent.id}
                    opponent={opponent}
                    disabled={!canFight}
                    fatigueWarning={isTooTired}
                    onFight={() => handleFight(opponent.id)}
                  />
                );
              })}
            </div>
          </Card>

          <div className="space-y-5">
            <Card title="Ranking Local" iconId="rank">
              <div className="space-y-3">
                {leaderboardRows.map((row, index) => (
                  <div key={row.name} className={`flex items-center justify-between gap-3 border px-3 py-2 font-mono text-sm ${row.active ? "border-gold/45 bg-gold/10 text-gold-soft" : "border-iron bg-background/45 text-text-muted"}`}>
                    <div className="flex min-w-0 items-center gap-2">
                      <CharacterPortrait
                        assetId={row.portraitAssetId}
                        name={row.name}
                        size="xs"
                        rounded="xs"
                        withPlayerBadge={row.active}
                      />
                      <span className="truncate">{index + 1}. {row.name}</span>
                    </div>
                    <span>{row.score}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Ultimos Duelos" iconId="info">
              {arenaResults.length === 0 ? (
                <div className="border border-dashed border-iron p-5 text-center text-text-muted">
                  <p>Aun no hay sangre en la arena.</p>
                  <Link href="/training" className="mt-3 inline-flex items-center gap-2 text-gold hover:underline">
                    <UiAssetIcon id="training" label="Entrenar" className="h-7 w-7" />
                    Entrenar antes
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {arenaResults.slice(0, 5).map((result) => {
                    const opponent = opponents.find((entry) => entry.id === result.opponentId);
                    return (
                      <div key={result.id} className="border border-iron bg-background/45 p-3">
                        <div className="flex items-start gap-3">
                          <CharacterPortrait
                            assetId={opponent?.portraitAssetId}
                            name={opponent?.name ?? result.opponentId}
                            size="sm"
                            rounded="xs"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-cinzel text-sm font-bold uppercase text-gold">{opponent?.name ?? result.opponentId}</span>
                              <Badge variant={result.success ? "success" : "danger"}>{result.success ? "Victoria" : "Derrota"}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-text-muted">{result.report}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function ArenaOpponentCard({
  opponent,
  disabled,
  fatigueWarning,
  onFight,
}: {
  opponent: ArenaOpponent;
  disabled: boolean;
  fatigueWarning: boolean;
  onFight: () => void;
}) {
  return (
    <section className="arena-opponent-row game-panel overflow-hidden p-0">
      <div className="relative bg-stone-950">
        <img
          src={featuredAssetPaths.tavernTable}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 scene-image-realism"
          draggable={false}
        />
        <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/80 to-background/45" />
        <div className="relative z-10 grid gap-3 p-3 md:grid-cols-[220px_minmax(0,1fr)] md:p-4">
          <div className="scene-frame relative flex min-h-56 justify-center overflow-hidden rounded-xs border border-iron bg-stone-950">
            <CharacterPortrait
              assetId={opponent.portraitAssetId}
              name={opponent.name}
              size="xl"
              rounded="xs"
              className="border-0 shadow-none"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-background/95 to-transparent p-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gold-soft/85">{opponent.rank}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-end gap-3">
            <div className="max-w-xl">
              <h2 className="font-cinzel text-xl font-extrabold uppercase tracking-wider text-gold md:text-2xl">
                {opponent.name}
              </h2>
              <p className="mt-1 text-sm text-text-muted">{opponent.description}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-gold-soft/80">{opponent.style}</p>
            </div>

            <VisualOfferGrid
              offers={[
                { id: "power", iconId: "risk", label: "Poder", value: opponent.power, tooltip: "Poder del rival" },
                { id: "fatigue", iconId: "fatigue", label: "Fatiga", value: `+${opponent.fatigue}`, tooltip: fatigueWarning ? "Fatiga alta tras el duelo" : "Coste de fatiga" },
                { id: "coins", iconId: "coins", label: "Botin", value: `+${opponent.rewards.coins}`, tooltip: "Paga posible" },
                { id: "honor", iconId: "honor", label: "Honor", value: `+${opponent.rewards.honor}`, tooltip: "Honor posible" },
              ]}
            />

            <button
              type="button"
              disabled={disabled}
              onClick={onFight}
              className="blood-button inline-flex min-h-12 items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-40"
            >
              <UiAssetIcon id="arena" label="" className="h-5 w-5" />
              Batirse
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArenaStat({ icon, label, value, danger = false }: { icon: React.ComponentProps<typeof UiAssetIcon>["id"]; label: string; value: string; danger?: boolean }) {
  return (
    <div className="icon-stat-tile flex min-h-16 items-center gap-2 p-2">
      <UiAssetIcon id={icon} label={label} className="h-8 w-8" />
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted">{label}</p>
        <p className={`font-cinzel text-xl font-bold ${danger ? "text-danger" : "text-text"}`}>{value}</p>
      </div>
    </div>
  );
}
