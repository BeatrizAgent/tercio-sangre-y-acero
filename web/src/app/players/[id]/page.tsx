import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageTransition } from "@/components/game/page-transition";
import { CharacterPortrait } from "@/components/ui/character-portrait";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { getItem } from "@/lib/game-data";
import { getPublicPlayerProfileFromDb } from "@/lib/server/player-profiles";
import { STAT_LABELS } from "@/lib/stats";
import type { EquipmentSlot, StatId } from "@/lib/types";

export const dynamic = "force-dynamic";

const STAT_ORDER: StatId[] = ["pike", "sword", "arquebus", "discipline", "vigor", "cunning", "command"];
const EQUIPMENT_LABELS: Record<EquipmentSlot, string> = {
  head: "Cabeza",
  body: "Cuerpo",
  mainHand: "Mano diestra",
  offHand: "Mano siniestra",
  firearm: "Arcabuz",
  accessory: "Accesorio",
  boots: "Botas",
  consumable: "Avios",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicPlayerProfileFromDb(id);
  if (!profile) notFound();

  const equipment = Object.entries(profile.equipment) as [EquipmentSlot, string][];

  return (
    <PageTransition>
      <section className="mx-auto w-full max-w-[980px]">
        <Link
          href="/players"
          className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-gold-soft hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Soldados
        </Link>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="game-panel p-4">
            <CharacterPortrait
              assetId={profile.portraitAssetId}
              name={profile.name}
              size="xl"
              className="mx-auto"
            />
            <div className="mt-4 text-center">
              <h1 className="font-cinzel text-xl font-bold uppercase tracking-[0.08em] text-gold-soft">
                {profile.name}
              </h1>
              <div className="mt-1 text-sm text-text-muted">{profile.rankName}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="border border-gold/15 bg-black/20 p-2">
                <div className="font-mono text-lg font-bold text-gold-soft">{profile.level}</div>
                <div className="uppercase tracking-wide text-text-muted">Nivel</div>
              </div>
              <div className="border border-gold/15 bg-black/20 p-2">
                <div className="font-mono text-lg font-bold text-gold-soft">{formatNumber(profile.honor)}</div>
                <div className="uppercase tracking-wide text-text-muted">Honor</div>
              </div>
              <div className="border border-gold/15 bg-black/20 p-2">
                <div className="font-mono text-lg font-bold text-gold-soft">{formatNumber(profile.reputation)}</div>
                <div className="uppercase tracking-wide text-text-muted">Fama</div>
              </div>
              <div className="border border-gold/15 bg-black/20 p-2">
                <div className="font-mono text-lg font-bold text-gold-soft">{formatNumber(profile.fatigue)}</div>
                <div className="uppercase tracking-wide text-text-muted">Fatiga</div>
              </div>
            </div>
          </aside>

          <div className="grid gap-4">
            <section className="game-panel p-4">
              <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.08em] text-gold-soft">
                Estadisticas
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {STAT_ORDER.map((stat) => (
                  <div key={stat} className="flex items-center justify-between border border-gold/10 bg-black/20 px-3 py-2">
                    <span className="text-sm text-text-muted">{STAT_LABELS[stat]}</span>
                    <span className="font-mono text-sm font-bold text-text">{profile.stats[stat]}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="game-panel p-4">
              <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.08em] text-gold-soft">
                Servicio
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {[
                  ["XP", formatNumber(profile.xp), "rank"],
                  ["Misiones", formatNumber(profile.missionCount), "missions"],
                  ["Arena", `${formatNumber(profile.arenaWins)}-${formatNumber(profile.arenaLosses)}`, "arena"],
                  ["Heridas", formatNumber(profile.openWounds), "hospital"],
                ].map(([label, value, icon]) => (
                  <div key={label} className="flex items-center gap-2 border border-gold/10 bg-black/20 px-3 py-2">
                    <UiAssetIcon id={icon as Parameters<typeof UiAssetIcon>[0]["id"]} label="" className="h-4 w-4" />
                    <div>
                      <div className="font-mono text-sm font-bold text-text">{value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="game-panel p-4">
              <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.08em] text-gold-soft">
                Equipo visible
              </h2>
              {equipment.length === 0 ? (
                <div className="mt-3 text-sm text-text-muted">Sin equipo visible.</div>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {equipment.map(([slot, itemId]) => (
                    <div key={slot} className="flex items-center justify-between border border-gold/10 bg-black/20 px-3 py-2">
                      <span className="text-sm text-text-muted">{EQUIPMENT_LABELS[slot]}</span>
                      <span className="truncate pl-3 text-right text-sm font-bold text-text">
                        {getItem(itemId)?.name ?? itemId}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
