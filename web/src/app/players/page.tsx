import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { PageTransition } from "@/components/game/page-transition";
import { CharacterPortrait } from "@/components/ui/character-portrait";
import { listPublicPlayerProfilesFromDb } from "@/lib/server/player-profiles";

export const dynamic = "force-dynamic";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

export default async function PlayersPage() {
  const players = await listPublicPlayerProfilesFromDb();

  return (
    <PageTransition>
      <section className="mx-auto w-full max-w-[920px]">
        <div className="mb-4 border-b border-gold/25 pb-3">
          <h1 className="font-cinzel text-xl font-bold uppercase tracking-[0.08em] text-gold-soft">
            Soldados
          </h1>
        </div>

        {players.length === 0 ? (
          <div className="game-panel p-5 text-sm text-text-muted">
            Aun no hay soldados reales en la lista.
          </div>
        ) : (
          <div className="grid gap-2">
            {players.map((player, index) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="game-panel group flex min-w-0 items-center gap-3 p-3 transition-colors hover:border-gold/60 hover:bg-gold/5"
              >
                <div className="w-9 shrink-0 text-center font-mono text-sm font-bold text-gold-soft">
                  {index + 1}
                </div>
                <CharacterPortrait assetId={player.portraitAssetId} name={player.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-cinzel text-base font-bold text-text">{player.name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                    <span>Nivel {player.level}</span>
                    <span>{player.rankName}</span>
                    <span>Honor {formatNumber(player.honor)}</span>
                  </div>
                </div>
                <div className="hidden grid-cols-3 gap-2 text-right text-xs text-text-muted sm:grid">
                  <span>Misiones {formatNumber(player.missionCount)}</span>
                  <span>Victorias {formatNumber(player.arenaWins)}</span>
                  <span>Heridas {formatNumber(player.openWounds)}</span>
                </div>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-gold/25 bg-black/25 text-gold-soft group-hover:bg-gold/15">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        )}

      </section>
    </PageTransition>
  );
}
