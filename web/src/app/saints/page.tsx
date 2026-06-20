"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { ArrowRight, Clock, RotateCw } from "lucide-react";
import { PageTransition } from "@/components/game/page-transition";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { useGameStore } from "@/lib/game-store";
import { playCoinSound, playPageSound } from "@/lib/sounds";

type SaintsTab = "misiones" | "objetivos" | "panteon" | "camara";
type UiIconId = ComponentProps<typeof UiAssetIcon>["id"];

const tabs: Array<{
  key: SaintsTab;
  label: string;
  iconId: "saintsDevotion" | "longMissions" | "objectives" | "chestChamber";
}> = [
  { key: "misiones", label: "Misiones largas", iconId: "longMissions" },
  { key: "objetivos", label: "Objetivos", iconId: "objectives" },
  { key: "panteon", label: "Santos", iconId: "saintsDevotion" },
  { key: "camara", label: "Camara de cofres", iconId: "chestChamber" },
];

const longMissions: Array<{
  title: string;
  iconId: UiIconId;
  progress: string;
  coins: number;
  rewardIcons: Array<UiIconId | null>;
  action: "continue" | "start";
}> = [
  {
    title: "Vence a 9 enemigos seguidos en expediciones, mazmorras o en las arenas",
    iconId: "longMissions",
    progress: "2 / 9",
    coins: 76,
    rewardIcons: ["coins", "honor", "wound", "cityHouseOfTrade", null],
    action: "continue",
  },
  {
    title: "Encuentra 8 objetos en expediciones o mazmorras",
    iconId: "longMissions",
    progress: "",
    coins: 179,
    rewardIcons: ["coins", "inventory", "honor", null, null],
    action: "start",
  },
  {
    title: "Arena: gana en 3 ataques seguidos contra enemigos de los que puedes conseguir oro",
    iconId: "longMissions",
    progress: "00:14:23",
    coins: 210,
    rewardIcons: ["coins", "rank", "wound", null, null],
    action: "start",
  },
  {
    title: "Bosque Sombrio: vence 6 x Lobo",
    iconId: "longMissions",
    progress: "",
    coins: 218,
    rewardIcons: ["coins", "honor", "shield", null, "risk"],
    action: "start",
  },
  {
    title: "Puerto Pirata: vence a cada enemigo al menos una vez",
    iconId: "longMissions",
    progress: "",
    coins: 332,
    rewardIcons: ["coins", "confirm", "honor", null, "risk"],
    action: "start",
  },
  {
    title: "Vence a 5 enemigos en expediciones, en mazmorras o en las arenas",
    iconId: "longMissions",
    progress: "",
    coins: 79,
    rewardIcons: ["coins", "inventory", "cityHouseOfTrade", "wound", "risk"],
    action: "start",
  },
] as const;

const objectiveSections: Array<{
  title: string;
  rows: Array<{
    title: string;
    progress: number;
    total: number;
    rewards: Array<{ amount: number; iconId: UiIconId | null }>;
  }>;
}> = [
  {
    title: "Desarrollo de personaje",
    rows: [
      {
        title: "Alcanza el nivel 5",
        progress: 4,
        total: 5,
        rewards: [
          { amount: 10, iconId: "wound" },
          { amount: 10, iconId: "honor" },
          { amount: 10, iconId: "risk" },
          { amount: 10, iconId: "inventory" },
          { amount: 10, iconId: "confirm" },
          { amount: 10, iconId: "cityHouseOfTrade" },
        ],
      },
      {
        title: "Aumenta todas las habilidades a 15",
        progress: 3,
        total: 6,
        rewards: [
          { amount: 9, iconId: "wound" },
          { amount: 9, iconId: "honor" },
          { amount: 9, iconId: "risk" },
          { amount: 9, iconId: "inventory" },
          { amount: 9, iconId: "confirm" },
          { amount: 9, iconId: "cityHouseOfTrade" },
        ],
      },
    ],
  },
  {
    title: "Expediciones",
    rows: [
      {
        title: "Reune toda la informacion y las bonificaciones de 3 adversarios de expedicion",
        progress: 2,
        total: 3,
        rewards: [
          { amount: 11, iconId: "honor" },
          { amount: 3, iconId: "cityHouseOfTrade" },
        ],
      },
      {
        title: "Derrota en una expedicion a un jefe de zona",
        progress: 0,
        total: 1,
        rewards: [
          { amount: 3, iconId: "wound" },
          { amount: 12, iconId: "honor" },
          { amount: 0, iconId: null },
        ],
      },
    ],
  },
  {
    title: "Arenas",
    rows: [
      {
        title: "Vence a mas de 25 gladiadores en la Arena",
        progress: 12,
        total: 25,
        rewards: [
          { amount: 3, iconId: "wound" },
          { amount: 9, iconId: "inventory" },
        ],
      },
      {
        title: "Alcanza el lugar 3 en la Arena",
        progress: 0,
        total: 3,
        rewards: [
          { amount: 15, iconId: "honor" },
          { amount: 26, iconId: "inventory" },
        ],
      },
    ],
  },
  {
    title: "Equipo",
    rows: [
      {
        title: "Aumenta un valor de dano de 14",
        progress: 7,
        total: 14,
        rewards: [
          { amount: 4, iconId: "risk" },
          { amount: 3, iconId: "confirm" },
        ],
      },
      {
        title: "Alcanza un valor de armadura de 370",
        progress: 143,
        total: 370,
        rewards: [
          { amount: 4, iconId: "risk" },
          { amount: 3, iconId: "cityHouseOfTrade" },
        ],
      },
    ],
  },
] as const;

const churchSaints: Array<{
  name: string;
  progress: string;
  level: string;
  iconId: UiIconId | null;
  positionClass: string;
  orbClass: string;
}> = [
  {
    name: "Santiago Apostol",
    progress: "43 / 63",
    level: "II",
    iconId: "saintsDevotion",
    positionClass: "left-1/2 top-2 -translate-x-1/2",
    orbClass: "left-1/2 top-[40%] -translate-x-1/2 bg-[#b89232]",
  },
  {
    name: "San Miguel Arcangel",
    progress: "10 / 26",
    level: "II",
    iconId: "saintsDevotion",
    positionClass: "left-[8%] top-[24%]",
    orbClass: "left-[34%] top-[44%] bg-[#e9d56a]",
  },
  {
    name: "Santa Barbara",
    progress: "8 / 28",
    level: "II",
    iconId: "saintsDevotion",
    positionClass: "right-[8%] top-[24%]",
    orbClass: "right-[34%] top-[44%] bg-[#7d2d84]",
  },
  {
    name: "San Sebastian",
    progress: "10 / 28",
    level: "II",
    iconId: "saintsDevotion",
    positionClass: "left-[8%] bottom-[12%]",
    orbClass: "left-[34%] bottom-[34%] bg-[#8d1f1f]",
  },
  {
    name: "San Mauricio",
    progress: "29 / 49",
    level: "II",
    iconId: "saintsDevotion",
    positionClass: "right-[8%] bottom-[12%]",
    orbClass: "right-[34%] bottom-[34%] bg-[#c56d1b]",
  },
  {
    name: "San Martin de Tours",
    progress: "6 / 26",
    level: "II",
    iconId: "saintsDevotion",
    positionClass: "left-1/2 bottom-0 -translate-x-1/2",
    orbClass: "left-1/2 bottom-[29%] -translate-x-1/2 bg-[#2d9b39]",
  },
];

const treasureDrops: Array<{ label: string; iconId: UiIconId | null; quantity?: number; rare?: boolean }> = [
  { label: "Lingotes de cobre", iconId: "coins", quantity: 2 },
  { label: "Mercenario devoto", iconId: "soldier" },
  { label: "Capa votiva roja", iconId: null, quantity: 5 },
  { label: "Capa votiva carmesi", iconId: null, quantity: 6 },
  { label: "Cesto de ofrendas", iconId: "packages" },
  { label: "Frascos de botica", iconId: "hospital", rare: true },
  { label: "Cobre sellado", iconId: "coins", quantity: 2 },
  { label: "Reloj de espera", iconId: "fatigue", quantity: 5 },
  { label: "Elixir piadoso", iconId: "wound", quantity: 2 },
  { label: "Cobre bendecido", iconId: "coins", quantity: 2 },
  { label: "Cobre viejo", iconId: "coins", quantity: 2 },
  { label: "Reliquia mayor", iconId: "saintsDevotion", rare: true },
];

export default function SaintsPage() {
  const { soldier } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<SaintsTab>("misiones");

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="py-12 text-center font-cinzel text-xl text-gold animate-pulse">Encendiendo cirios...</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-iron pb-3">
          <div className="flex items-center gap-3">
            <UiAssetIcon id="saintsDevotion" label="Santos" className="h-12 w-12" />
            <div>
              <h1 className="font-cinzel text-2xl font-extrabold uppercase text-gold md:text-3xl">Los Santos</h1>
              <p className="text-sm text-text-muted">Votos, largas guardias y arcas de cobre bajo llave.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right font-mono text-xs uppercase">
            <div className="border border-gold/25 bg-background/70 px-3 py-1 text-gold-soft">
              Honor {soldier.honor}
            </div>
            <div className="border border-gold/25 bg-background/70 px-3 py-1 text-gold-soft">
              Dob {soldier.coins}
            </div>
          </div>
        </header>

        <div className="flex overflow-hidden rounded-xs border border-iron/70 bg-panel-soft/20">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                playPageSound();
                setActiveTab(tab.key);
              }}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 border-r border-iron/60 px-2 py-2 text-[11px] font-sans uppercase tracking-wider transition-all last:border-r-0 ${
                activeTab === tab.key
                  ? "bg-blood/15 text-gold font-bold shadow-[inset_0_-2px_0_0_#c9a24f]"
                  : "text-text-muted hover:bg-panel-soft/30 hover:text-text"
              }`}
            >
              <UiAssetIcon id={tab.iconId} label={tab.label} className="h-6 w-6" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "misiones" && (
          <section className="game-panel p-3 md:p-4">
            <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-cinzel text-xl font-extrabold uppercase tracking-wide text-gold-soft">
                <span className="inline-flex items-center gap-2">
                  <UiAssetIcon id="longMissions" label="Misiones largas" className="h-9 w-9" />
                  Misiones aceptadas: 1 / 3
                </span>
              </h2>
              <span className="border border-gold/25 bg-background/70 px-3 py-1 font-mono text-xs uppercase text-gold-soft">
                Tiempo largo
              </span>
            </div>

            <div className="relative z-10 overflow-hidden border border-[#9b7a3f] bg-[#5a3518]/55 p-2 shadow-inner">
              {longMissions.map((mission) => (
                <article
                  key={mission.title}
                  className="grid min-h-20 grid-cols-[54px_1fr_42px] gap-2 border border-[#b99550] bg-[#ead9ad] p-1.5 text-[#4a2307] shadow-[inset_0_0_0_1px_rgba(255,245,200,0.45)] md:grid-cols-[62px_1fr_54px]"
                >
                  <div className="flex items-center justify-center border border-[#8b642d] bg-[#d0aa5b] p-1 shadow-inner">
                    <div className="flex h-11 w-11 items-center justify-center border border-[#5f3b14] bg-[#6e431b] md:h-12 md:w-12">
                      <UiAssetIcon id={mission.iconId} label={mission.title} className="h-9 w-9 md:h-10 md:w-10" />
                    </div>
                  </div>

                  <div className="min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-cinzel text-sm font-extrabold leading-tight text-[#4a2307] md:text-base">
                        {mission.title}
                      </h3>
                      {mission.progress && (
                        <span className="shrink-0 font-mono text-xs font-bold text-[#5b2b09]">
                          {mission.progress.includes(":") ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {mission.progress}
                            </span>
                          ) : (
                            mission.progress
                          )}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-xs font-bold">
                      <span className="mr-1 text-[#6d3d14]">Recompensa:</span>
                      <span className="text-[#8a4f0f]">{mission.coins}</span>
                      {mission.rewardIcons.map((iconId, index) =>
                        iconId ? (
                          <span
                            key={`${mission.title}-${iconId}-${index}`}
                            className="flex h-5 w-5 items-center justify-center border border-[#9b6b24] bg-[#d8bd73]"
                          >
                            <UiAssetIcon id={iconId} label="Recompensa" className="h-4 w-4" />
                          </span>
                        ) : (
                          <span
                            key={`${mission.title}-empty-${index}`}
                            className="h-5 w-5 border border-dashed border-[#9b6b24] bg-[#d8bd73]/45"
                          />
                        ),
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={playPageSound}
                    className="flex h-full min-h-14 items-center justify-center border border-[#8b642d] bg-linear-to-b from-[#e3a42b] to-[#92530e] text-[#3b1a05] shadow-[inset_0_1px_0_rgba(255,242,162,0.65)] hover:brightness-110"
                    title={mission.action === "continue" ? "Continuar mision" : "Aceptar mision"}
                  >
                    {mission.action === "continue" ? <RotateCw className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  </button>
                </article>
              ))}
            </div>

            <div className="relative z-10 mt-4 flex flex-col items-center gap-1">
              <button
                type="button"
                disabled
                className="min-w-44 border border-[#caa95a] bg-[#927038] px-5 py-1.5 font-cinzel text-sm font-bold uppercase text-[#ffe6a8] opacity-80"
              >
                Misiones nuevas
              </button>
              <span className="font-mono text-xs text-text-muted">(Activa tiempo de espera)</span>
            </div>
          </section>
        )}

        {activeTab === "objetivos" && (
          <section className="game-panel p-3 md:p-4">
            <div className="relative z-10 border border-[#7b3b18] bg-[#ead9ad] p-2 text-[#4a2307] shadow-[inset_0_0_0_2px_rgba(255,245,200,0.35)] md:p-3">
              <div className="mb-3 border border-[#c2a667] bg-[#f3e9ca] px-3 py-2 font-sans text-sm font-bold leading-relaxed text-red-600">
                Todavia no se ha verificado tu direccion de correo electronico. Por favor, dirigete a
                {" "}
                <span className="underline">Gameforge.com</span> para validar tu direccion de correo electronico.
              </div>

              <div className="space-y-3">
                {objectiveSections.map((section) => (
                  <section key={section.title} className="overflow-hidden border border-[#6b3416] bg-[#6a3d1d] shadow-md">
                    <h2 className="flex items-center gap-2 bg-linear-to-r from-[#9d7442] via-[#7c4b24] to-[#3f2412] px-4 py-1.5 font-cinzel text-xl font-extrabold text-[#ffe6ad] shadow-inner">
                      <UiAssetIcon id="objectives" label="Objetivos" className="h-8 w-8" />
                      <span>{section.title}</span>
                    </h2>
                    <div className="space-y-0.5 p-1.5">
                      {section.rows.map((objective) => {
                        const ratio = Math.min(100, Math.max(0, (objective.progress / objective.total) * 100));
                        return (
                          <article
                            key={objective.title}
                            className="grid min-h-[76px] gap-2 border border-[#b99550] bg-[#efe0b7] p-2 shadow-[inset_0_0_0_1px_rgba(255,245,200,0.45)] md:grid-cols-[1fr_120px]"
                          >
                            <div className="min-w-0">
                              <h3 className="font-cinzel text-sm font-extrabold leading-tight text-[#4a2307] md:text-base">
                                {objective.title}
                              </h3>
                              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
                                <span className="text-[#6d3d14]">Recompensa:</span>
                                {objective.rewards.map((reward, index) =>
                                  reward.iconId ? (
                                    <span
                                      key={`${objective.title}-${reward.iconId}-${index}`}
                                      className="inline-flex items-center gap-1 text-[#7b3d09]"
                                    >
                                      {reward.amount > 0 && <span>{reward.amount}</span>}
                                      <span className="flex h-5 w-5 items-center justify-center border border-[#9b6b24] bg-[#d8bd73]">
                                        <UiAssetIcon id={reward.iconId} label="Recompensa" className="h-4 w-4" />
                                      </span>
                                    </span>
                                  ) : (
                                    <span
                                      key={`${objective.title}-empty-${index}`}
                                      className="h-5 w-5 border border-dashed border-[#9b6b24] bg-[#d8bd73]/45"
                                    />
                                  ),
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-center gap-2">
                              <div className="text-right font-mono text-base font-extrabold text-[#5b2b09]">
                                {objective.progress} / {objective.total}
                              </div>
                              <div className="h-2.5 overflow-hidden border border-[#3c210d] bg-[#f8f1d6] shadow-inner">
                                <div className="h-full bg-lime-600" style={{ width: `${ratio}%` }} />
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "panteon" && (
          <section className="game-panel p-3 md:p-4">
            <div className="relative z-10 overflow-hidden border border-[#7b3b18] bg-[#ead9ad] p-3 text-[#4a2307] shadow-[inset_0_0_0_2px_rgba(255,245,200,0.35)]">
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-[#b8944c] pb-2">
                <h2 className="font-cinzel text-xl font-extrabold uppercase text-[#6b3416]">Santos de la Iglesia</h2>
                <span className="font-mono text-sm font-bold text-[#7b3d09]">Devocion: 6 / 300</span>
              </div>

              <div className="relative mx-auto min-h-[640px] max-w-[760px]">
                <div className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-[6px] border-[#6c5d34] bg-[#d8c378] shadow-[0_0_0_3px_#2f2714,0_8px_18px_rgba(0,0,0,0.35)] [clip-path:polygon(50%_0,95%_25%,95%_75%,50%_100%,5%_75%,5%_25%)]">
                  <span className="font-cinzel text-lg font-extrabold text-[#6b3416]">6 / 300</span>
                </div>

                <div className="absolute left-1/2 top-1/2 h-px w-[70%] -translate-x-1/2 bg-[#2f2714]/75" />
                <div className="absolute left-1/2 top-1/2 h-[70%] w-px -translate-y-1/2 bg-[#2f2714]/75" />
                <div className="absolute left-1/2 top-1/2 h-px w-[58%] -translate-x-1/2 rotate-45 bg-[#2f2714]/75" />
                <div className="absolute left-1/2 top-1/2 h-px w-[58%] -translate-x-1/2 -rotate-45 bg-[#2f2714]/75" />

                {churchSaints.map((saint) => (
                  <article
                    key={saint.name}
                    className={`absolute z-20 w-36 text-center md:w-40 ${saint.positionClass}`}
                  >
                    <div className="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border-[8px] border-[#625633] bg-[#2b2414] shadow-[0_0_0_2px_#151007,0_10px_24px_rgba(0,0,0,0.42)] md:h-36 md:w-36">
                      <div className="mb-1 font-mono text-sm font-extrabold text-[#d7c278]">{saint.level}</div>
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#9b8548] bg-[#493915] shadow-inner md:h-24 md:w-24">
                        {saint.iconId ? (
                          <UiAssetIcon id={saint.iconId} label={saint.name} className="h-16 w-16" />
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-wide text-[#d7c278]/70">Retrato</span>
                        )}
                      </div>
                    </div>
                    <div className="-mt-4 border border-[#8b642d] bg-[#dbc28b] px-2 py-1 shadow-md">
                      <h3 className="font-cinzel text-base font-extrabold leading-tight text-[#6b3416]">{saint.name}</h3>
                      <div className="font-mono text-sm font-bold text-[#7b3d09]">{saint.progress}</div>
                    </div>
                  </article>
                ))}

                {churchSaints.map((saint) => (
                  <span
                    key={`${saint.name}-orb`}
                    className={`absolute z-30 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#514522] shadow-[0_0_0_2px_#1d1609,0_4px_10px_rgba(0,0,0,0.35)] ${saint.orbClass}`}
                  >
                    <UiAssetIcon id="saintsDevotion" label={saint.name} className="h-7 w-7" />
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "camara" && (
          <section className="game-panel p-3 md:p-4">
            <div className="relative z-10 overflow-hidden border border-[#7b3b18] bg-[#ead9ad] p-2 text-[#4a2307] shadow-[inset_0_0_0_2px_rgba(255,245,200,0.35)] md:p-3">
              <div className="grid gap-4 border border-[#b99550] bg-[#f0dfb2] p-3 shadow-[inset_0_0_0_1px_rgba(255,245,200,0.45)] md:grid-cols-[92px_1fr_140px]">
                <div className="border border-[#8b642d] bg-[#7f180d] p-1 shadow-inner">
                  <div className="flex h-20 items-center justify-center border border-[#4d160a] bg-[#2c1208]">
                    <UiAssetIcon id="chestChamber" label="Baul de la providencia divina" className="h-16 w-16" />
                  </div>
                  <div className="mt-1 bg-[#89150d] py-1 text-center font-mono text-lg font-extrabold text-white">0</div>
                </div>

                <div className="min-w-0">
                  <h2 className="font-cinzel text-xl font-extrabold text-[#4a2307]">Baul de la providencia divina</h2>
                  <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-[#5b2b09]">
                    En cada cofre hay un total de 12 tesoros de 3 niveles de calidad posibles: hasta 1 de oro, hasta 2 de plata y hasta 9 de bronce. Hasta que no se abre el cofre, no se descubren los tesoros que el santo ha tenido a bien ofrecerte.
                  </p>
                </div>

                <div className="flex flex-col items-stretch justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => playCoinSound()}
                    className="border border-[#9c6b19] bg-linear-to-b from-[#ffe596] via-[#e2a335] to-[#9a5a12] px-6 py-1.5 font-cinzel text-sm font-extrabold text-[#5a2505] shadow-[inset_0_1px_0_rgba(255,255,210,0.75)] hover:brightness-110"
                  >
                    Abrir
                  </button>
                  <div className="text-center font-mono text-xs font-bold text-[#6b3416]">
                    Costes 7 <span className="text-red-700">◆</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border border-[#b99550] bg-[#f0dfb2] p-3 shadow-[inset_0_0_0_1px_rgba(255,245,200,0.45)]">
                <h3 className="mb-3 font-cinzel text-lg font-extrabold text-[#4a2307]">Posibles ganancias:</h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {treasureDrops.map((drop) => (
                    <div
                      key={drop.label}
                      className={`relative aspect-square border-2 bg-[#7f180d] p-1 shadow-inner ${
                        drop.rare ? "border-[#87a9d8]" : "border-[#8b642d]"
                      }`}
                      title={drop.label}
                    >
                      <div className="flex h-full w-full items-center justify-center border border-[#f4e0a3] bg-[#521006]">
                        {drop.iconId ? (
                          <UiAssetIcon id={drop.iconId} label={drop.label} className="h-14 w-14" />
                        ) : (
                          <UiAssetIcon id="chestChamber" label={drop.label} className="h-14 w-14 opacity-80" />
                        )}
                      </div>
                      {drop.quantity && (
                        <span className="absolute bottom-1 right-1 min-w-5 rounded-full border border-[#f4d58a] bg-[#8b120c] px-1 text-center font-mono text-xs font-extrabold text-white">
                          {drop.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center gap-1 bg-[#6a3d1d] py-3">
                <button
                  type="button"
                  disabled
                  className="min-w-44 border border-[#d5b263] bg-[#9b7a3f] px-5 py-1.5 font-cinzel text-sm font-extrabold text-[#ffe6a8] opacity-90"
                >
                  Nuevo contenido
                </button>
                <span className="font-mono text-xs font-bold text-[#ffe6a8]">
                  Costes 1 <span className="text-[#d98b27]">◉</span>
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
