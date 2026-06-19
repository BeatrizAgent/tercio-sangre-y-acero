"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { featuredAssetPaths, getAssetPathById, listArenaOpponents } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";

export default function ArenaPage() {
  const soldier = useGameStore((state) => state.soldier);
  const arenaResults = useGameStore((state) => state.arenaResults ?? []);
  const fightArenaOpponent = useGameStore((state) => state.fightArenaOpponent);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const opponents = listArenaOpponents();
  const wins = arenaResults.filter((result) => result.success).length;
  const losses = arenaResults.length - wins;
  const canFight = soldier.fatigue < 100;

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
            <div className="mb-2 hidden grid-cols-[54px_minmax(0,1fr)_54px_78px_78px] gap-2 border-b border-iron px-2 pb-2 font-mono text-[11px] uppercase tracking-wider text-muted md:grid">
              <span>Rival</span>
              <span>Descripcion</span>
              <span>Poder</span>
              <span>Botin</span>
              <span>Accion</span>
            </div>
            <div className="grid gap-2">
              {opponents.map((opponent) => {
                const portrait = getAssetPathById(opponent.portraitAssetId) ?? featuredAssetPaths.diegoReady;
                const isTooTired = soldier.fatigue + opponent.fatigue > 115;
                return (
                  <article
                    key={opponent.id}
                    className="arena-opponent-row grid gap-2 border border-iron bg-background/45 p-2 md:grid-cols-[54px_minmax(0,1fr)_54px_78px_78px] md:items-center"
                  >
                    <div className="scene-frame relative h-12 w-12 overflow-hidden rounded-xs bg-stone-950">
                      <img
                        src={portrait}
                        alt={opponent.name}
                        className="h-full w-full object-cover portrait-realism"
                        onError={(event) => {
                          event.currentTarget.src = featuredAssetPaths.diegoReady;
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-cinzel text-sm font-bold uppercase tracking-wider text-gold">{opponent.name}</h2>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-gold-soft">{opponent.rank}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">{opponent.description}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-text">Uso: {opponent.style}</p>
                    </div>

                    <PlainStat title="Poder" value={String(opponent.power)} tone="text-danger" />

                    <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px] md:grid-cols-1 md:text-left">
                      <Reward icon="coins" value={`+${opponent.rewards.coins}`} />
                      <Reward icon="xp" value={`+${opponent.rewards.xp}`} />
                      <Reward icon="honor" value={`+${opponent.rewards.honor}`} />
                    </div>

                    <button
                      type="button"
                      disabled={!canFight}
                      onClick={() => handleFight(opponent.id)}
                      className={`blood-button w-full px-1.5 py-1.5 text-[10px] ${!canFight ? "opacity-40" : ""}`}
                      title={isTooTired ? "Ganarias mucha fatiga. Mejor descansar pronto." : "Batirse ahora"}
                    >
                      Batirse
                      <span className="block font-mono text-[9px] normal-case tracking-normal">Coste {opponent.fatigue}</span>
                    </button>
                  </article>
                );
              })}
            </div>
          </Card>

          <div className="space-y-5">
            <Card title="Ranking Local" iconId="rank">
              <div className="space-y-3">
                {[
                  { name: soldier.name, score: wins * 3 + soldier.honor, active: true },
                  { name: "Capitan Rojas", score: 18 },
                  { name: "Bruno de Namur", score: 9 },
                  { name: "Jaime el Cojo", score: 4 },
                ]
                  .sort((a, b) => b.score - a.score)
                  .map((row, index) => (
                    <div key={row.name} className={`flex items-center justify-between border px-3 py-2 font-mono text-sm ${row.active ? "border-gold/45 bg-gold/10 text-gold-soft" : "border-iron bg-background/45 text-text-muted"}`}>
                      <span>{index + 1}. {row.name}</span>
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
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-cinzel text-sm font-bold uppercase text-gold">{opponent?.name ?? result.opponentId}</span>
                          <Badge variant={result.success ? "success" : "danger"}>{result.success ? "Victoria" : "Derrota"}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-text-muted">{result.report}</p>
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

function PlainStat({ title, value, tone = "text-text" }: { title: string; value: string; tone?: string }) {
  return (
    <div className="border border-iron bg-stone-950/45 px-1.5 py-1 font-mono">
      <span className="block text-[10px] uppercase tracking-wider text-muted">{title}</span>
      <span className={`text-base font-bold ${tone}`}>{value}</span>
    </div>
  );
}

function Reward({ icon, value }: { icon: React.ComponentProps<typeof UiAssetIcon>["id"]; value: string }) {
  return (
    <span className="flex items-center justify-center gap-1 border border-iron bg-stone-950/50 px-1 py-0.5 text-gold-soft md:justify-start">
      <UiAssetIcon id={icon} label={value} className="h-3.5 w-3.5" />
      {value}
    </span>
  );
}
