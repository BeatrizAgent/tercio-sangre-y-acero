import { ChevronDown } from "lucide-react";
import type React from "react";

import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";

type PlayerRank = {
  rank: number;
  name: string;
  level: number;
  honor: string;
  fame: string;
  victories: number;
  achievements: number;
  gold: string;
  tone?: "player" | "ally";
};

const playerRanks: PlayerRank[] = [
  { rank: 51, name: "Tukekere", level: 30, honor: "52.026", fame: "12.205", victories: 498, achievements: 573, gold: "36.991", tone: "ally" },
  { rank: 52, name: "Yosber", level: 28, honor: "49.239", fame: "1.423", victories: 44, achievements: 290, gold: "7.360" },
  { rank: 53, name: "VicariiCatius", level: 24, honor: "44.957", fame: "12", victories: 94, achievements: 274, gold: "30.677" },
  { rank: 54, name: "PapaNoel", level: 48, honor: "39.115", fame: "168.811", victories: 129, achievements: 473, gold: "175.083" },
  { rank: 55, name: "ConsulDecius", level: 16, honor: "36.910", fame: "447", victories: 75, achievements: 304, gold: "28.140" },
  { rank: 56, name: "Ludy", level: 19, honor: "25.925", fame: "0", victories: 49, achievements: 194, gold: "14.300" },
  { rank: 57, name: "Carrasquinho", level: 21, honor: "22.568", fame: "3.736", victories: 314, achievements: 417, gold: "134.893" },
  { rank: 58, name: "La Joyita", level: 22, honor: "22.244", fame: "2.765", victories: 92, achievements: 224, gold: "10.130" },
  { rank: 59, name: "Jonathan", level: 20, honor: "17.362", fame: "3.775", victories: 84, achievements: 244, gold: "7.260" },
  { rank: 60, name: "Noe", level: 36, honor: "16.640", fame: "56.984", victories: 116, achievements: 466, gold: "29.353" },
  { rank: 61, name: "MasterThrax", level: 19, honor: "14.566", fame: "3.186", victories: 74, achievements: 347, gold: "12.065" },
  { rank: 62, name: "PROpsicopata", level: 18, honor: "14.345", fame: "1.716", victories: 131, achievements: 356, gold: "11.974" },
  { rank: 63, name: "gannicus", level: 17, honor: "11.620", fame: "272", victories: 197, achievements: 367, gold: "10.150" },
  { rank: 64, name: "Rafael2025", level: 16, honor: "10.128", fame: "314", victories: 117, achievements: 273, gold: "4.835" },
  { rank: 65, name: "DominusTubero", level: 14, honor: "9.194", fame: "0", victories: 16, achievements: 164, gold: "0" },
  { rank: 66, name: "Tulkas", level: 10, honor: "8.439", fame: "30", victories: 112, achievements: 363, gold: "6.707" },
  { rank: 67, name: "Paqueta", level: 19, honor: "6.839", fame: "1.277", victories: 151, achievements: 274, gold: "19.507", tone: "ally" },
  { rank: 68, name: "ComesGallus", level: 12, honor: "5.493", fame: "5", victories: 37, achievements: 214, gold: "2.669" },
  { rank: 69, name: "Darkizpck", level: 9, honor: "3.225", fame: "0", victories: 72, achievements: 134, gold: "11.127" },
  { rank: 70, name: "LegatusVettius", level: 9, honor: "1.703", fame: "0", victories: 46, achievements: 125, gold: "893" },
  { rank: 71, name: "GiganteHumano", level: 7, honor: "1.366", fame: "0", victories: 53, achievements: 158, gold: "859" },
  { rank: 72, name: "Diego de Arce", level: 5, honor: "926", fame: "0", victories: 12, achievements: 107, gold: "457", tone: "player" },
  { rank: 73, name: "robip", level: 5, honor: "432", fame: "0", victories: 16, achievements: 104, gold: "118" },
  { rank: 74, name: "Alain10", level: 5, honor: "298", fame: "0", victories: 7, achievements: 81, gold: "593" },
];

function SortLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center gap-0.5 whitespace-nowrap">
      {children}
      <ChevronDown className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

export default function RankingsPage() {
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
            <a className="text-gold-soft underline decoration-gold/50 underline-offset-2" href="#">Jugador</a>
            <span>-</span>
            <a className="text-gold-soft underline decoration-gold/50 underline-offset-2" href="#">Clasificacion - 7 dias</a>
            <a className="text-gold-soft underline decoration-gold/50 underline-offset-2" href="#">Clasificacion - Jugadores - Liga</a>
          </div>
          <label className="relative mt-3 inline-flex items-center gap-2 text-[13px] text-text">
            <span className="sr-only">Rango mostrado</span>
            <select className="border border-gold/35 bg-background px-2 py-1 font-mono text-[13px] text-gold-soft shadow-inner">
              <option>51-100</option>
              <option>1-50</option>
              <option>101-150</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse bg-[#201409] text-[13px] text-[#f1ddbd]">
            <thead>
              <tr className="border-b border-gold/25 bg-[url('/assets/gpt-bank/ui/icons/barra_panel_marron_larga.png')] bg-[length:100%_100%] font-cinzel text-[11px] uppercase text-gold-soft">
                <th className="w-11 px-1 py-2 text-center">Rango</th>
                <th className="px-1 py-2 text-left">Nombre</th>
                <th className="px-1 py-2 text-center"><SortLabel>Nivel</SortLabel></th>
                <th className="px-1 py-2 text-right"><SortLabel>Honor</SortLabel></th>
                <th className="px-1 py-2 text-right"><SortLabel>Fama</SortLabel></th>
                <th className="px-1 py-2 text-right"><SortLabel>Victorias</SortLabel></th>
                <th className="px-1 py-2 text-right"><SortLabel>Logros</SortLabel></th>
                <th className="px-2 py-2 text-right"><SortLabel>Oro</SortLabel></th>
              </tr>
            </thead>
            <tbody>
              {playerRanks.map((player) => (
                <tr
                  key={player.rank}
                  className={`border-b border-gold/10 ${
                    player.tone === "player"
                      ? "bg-[linear-gradient(90deg,rgba(201,162,79,0.92),rgba(235,193,106,0.82),rgba(201,162,79,0.92))] font-bold text-[#1d1308]"
                      : player.rank % 2 === 0
                        ? "bg-[#2c1d12]/92"
                        : "bg-[#24170e]/92"
                  }`}
                >
                  <td
                    className={`px-1 py-1.5 text-center font-mono text-[12px] ${
                      player.tone === "player" ? "text-[#1d1308]" : "text-gold-soft"
                    }`}
                  >
                    {player.rank}
                  </td>
                  <td className="px-1 py-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-gold/20 bg-black/35">
                        <UiAssetIcon
                          id={player.tone === "player" ? "shield" : player.tone === "ally" ? "honor" : "missions"}
                          label=""
                          className="h-3.5 w-3.5"
                        />
                      </span>
                      <a
                        href="#"
                        className={`truncate font-bold underline underline-offset-2 ${
                          player.tone === "ally" ? "text-success" : "text-inherit"
                        }`}
                      >
                        {player.name}
                      </a>
                    </div>
                  </td>
                  <td className="px-1 py-1.5 text-center">{player.level}</td>
                  <td className="px-1 py-1.5 text-right">{player.honor}</td>
                  <td className="px-1 py-1.5 text-right">{player.fame}</td>
                  <td className="px-1 py-1.5 text-right">{player.victories}</td>
                  <td className="px-1 py-1.5 text-right font-bold underline underline-offset-2">{player.achievements}</td>
                  <td className="px-2 py-1.5 text-right">{player.gold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageTransition>
  );
}
