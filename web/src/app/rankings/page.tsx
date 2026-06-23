import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type React from "react";

import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { listPublicPlayerProfilesFromDb } from "@/lib/server/player-profiles";

export const dynamic = "force-dynamic";

function SortLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center gap-0.5 whitespace-nowrap">
      {children}
      <ChevronDown className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

export default async function RankingsPage() {
  const players = await listPublicPlayerProfilesFromDb();

  return (
    <PageTransition>
      <section className="game-panel mx-auto w-full max-w-[780px] overflow-hidden p-0">
        <div className="relative overflow-hidden border-b border-gold/20 bg-[url('/assets/gpt-bank/ui/icons/barra_panel_negra_dorada.png')] bg-[length:100%_100%] px-4 py-5 text-center">
          <div className="pointer-events-none absolute inset-x-10 top-3 h-5 bg-[url('/assets/gpt-bank/ui/icons/ornamento_dorado_horizontal.png')] bg-contain bg-center bg-no-repeat opacity-55" />
          <div className="relative flex items-center justify-center gap-3">
            <img
              src="/assets/gpt-bank/ui/icons/estandarte_cruz_roja_colgante.png"
              alt=""
              className="h-10 w-10 object-contain opacity-90"
            />
            <h1 className="font-cinzel text-xl font-bold uppercase tracking-[0.08em] text-gold-soft">
              Clasificacion - Jugadores
            </h1>
            <img
              src="/assets/gpt-bank/ui/icons/condecoracion_estrella_laurel.png"
              alt=""
              className="h-10 w-10 object-contain opacity-90"
            />
          </div>
          <div className="relative mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-cinzel text-[13px] font-bold text-text-muted">
            <Link className="text-gold-soft underline decoration-gold/50 underline-offset-2" href="/players">
              Soldados
            </Link>
            <span>-</span>
            <span className="text-gold-soft">Honor</span>
          </div>
        </div>

        {players.length === 0 ? (
          <div className="bg-[#201409] p-5 text-center text-sm text-text-muted">
            Sin soldados registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse bg-[#201409] text-[13px] text-[#f1ddbd]">
              <thead>
                <tr className="border-b border-gold/25 bg-[url('/assets/gpt-bank/ui/icons/barra_panel_marron_larga.png')] bg-[length:100%_100%] font-cinzel text-[11px] uppercase text-gold-soft">
                  <th className="w-11 px-1 py-2 text-center">Rango</th>
                  <th className="px-1 py-2 text-left">Nombre</th>
                  <th className="px-1 py-2 text-center"><SortLabel>Nivel</SortLabel></th>
                  <th className="px-1 py-2 text-right"><SortLabel>Honor</SortLabel></th>
                  <th className="px-1 py-2 text-right"><SortLabel>Fama</SortLabel></th>
                  <th className="px-1 py-2 text-right"><SortLabel>Misiones</SortLabel></th>
                  <th className="px-1 py-2 text-right"><SortLabel>Arena</SortLabel></th>
                  <th className="px-2 py-2 text-right"><SortLabel>Heridas</SortLabel></th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr
                    key={player.id}
                    className={`border-b border-gold/10 ${index % 2 === 0 ? "bg-[#2c1d12]/92" : "bg-[#24170e]/92"}`}
                  >
                    <td className="px-1 py-1.5 text-center font-mono text-[12px] text-gold-soft">
                      {index + 1}
                    </td>
                    <td className="px-1 py-1.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-gold/20 bg-black/35">
                          <UiAssetIcon id="honor" label="" className="h-3.5 w-3.5" />
                        </span>
                        <Link
                          href={`/players/${player.id}`}
                          className="truncate font-bold text-inherit underline underline-offset-2 hover:text-gold-soft"
                        >
                          {player.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-1 py-1.5 text-center">{player.level}</td>
                    <td className="px-1 py-1.5 text-right">{formatNumber(player.honor)}</td>
                    <td className="px-1 py-1.5 text-right">{formatNumber(player.reputation)}</td>
                    <td className="px-1 py-1.5 text-right">{formatNumber(player.missionCount)}</td>
                    <td className="px-1 py-1.5 text-right">
                      {formatNumber(player.arenaWins)}-{formatNumber(player.arenaLosses)}
                    </td>
                    <td className="px-2 py-1.5 text-right">{formatNumber(player.openWounds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageTransition>
  );
}
