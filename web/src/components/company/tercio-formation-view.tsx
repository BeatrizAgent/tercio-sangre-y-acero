"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Flame, Footprints, Shield, Swords } from "lucide-react";
import type { CharacterState, FormationSlot, Stats } from "@/lib/types";
import { useGameStore } from "@/lib/game-store";
import {
  COMBAT_STAT_LABEL,
  DEFAULT_TERCIO_FORMATION_ID,
  FORMATION_META,
  FORMATION_ORDER,
  TERCIO_FORMATION_PRESETS,
  getFitState,
  type FormationDoctrine,
  type TercioFormationPreset,
  type TercioFormationPresetId,
} from "@/lib/formation";
import { UiAssetIcon } from "@/components/ui/ui-asset-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { playPageSound } from "@/lib/sounds";
import { formationRoleIconPaths, getAssetPathById, reportAssetPaths, tercioOrdinanceIconPaths } from "@/lib/game-data";

const PLAYER_ID = "diego_de_arce";
const FORMATION_FIELD_BG = "/assets/generated/scenes/tercio_formation_field_v01.png";

const DOCTRINE_LABEL: Record<FormationDoctrine, string> = {
  pica: "Pica",
  fuego: "Fuego",
  defensa: "Defensa",
  marcha: "Marcha",
  asalto: "Asalto",
};

const DOCTRINE_STYLE: Record<FormationDoctrine, string> = {
  pica: "border-blue-300/55 bg-blue-500/12 text-blue-100",
  fuego: "border-amber-300/55 bg-amber-500/12 text-amber-100",
  defensa: "border-emerald-300/50 bg-emerald-500/10 text-emerald-100",
  marcha: "border-stone-300/45 bg-stone-500/10 text-stone-100",
  asalto: "border-red-300/55 bg-red-500/12 text-red-100",
};

const DOCTRINE_ICON = {
  pica: Shield,
  fuego: Flame,
  defensa: Shield,
  marcha: Footprints,
  asalto: Swords,
} as const;

function sumStat(characters: CharacterState[], key: keyof Stats): number {
  return characters.reduce((total, character) => total + character.stats[key], 0);
}

function groupByPreset(characters: CharacterState[], preset: TercioFormationPreset) {
  const map: Record<FormationSlot, CharacterState[]> = {
    vanguardia: [],
    fuego: [],
    apoyo: [],
    retaguardia: [],
    banquillo: [],
  };

  for (const character of characters) {
    const assigned = preset.assignments[character.id as keyof typeof preset.assignments] ?? "banquillo";
    map[assigned].push(character);
  }

  for (const slot of FORMATION_ORDER) {
    map[slot].sort((a, b) => {
      if (a.id === PLAYER_ID) return -1;
      if (b.id === PLAYER_ID) return 1;
      return b.stats.command - a.stats.command || b.stats.discipline - a.stats.discipline;
    });
  }

  return map;
}

function currentPresetId(characters: CharacterState[]): TercioFormationPresetId | null {
  const match = TERCIO_FORMATION_PRESETS.find((preset) =>
    characters.every((character) => {
      const assigned = preset.assignments[character.id as keyof typeof preset.assignments] ?? "banquillo";
      return character.formationSlot === assigned;
    }),
  );
  return match?.id ?? null;
}

export function TercioFormationView() {
  const { characters, setFormationSlot } = useGameStore();
  const activePresetId = currentPresetId(characters);
  const [selectedId, setSelectedId] = useState<TercioFormationPresetId>(
    activePresetId ?? DEFAULT_TERCIO_FORMATION_ID,
  );

  const selectedPreset = useMemo(
    () => TERCIO_FORMATION_PRESETS.find((preset) => preset.id === selectedId) ?? TERCIO_FORMATION_PRESETS[0],
    [selectedId],
  );

  const grouped = useMemo(
    () => groupByPreset(characters, selectedPreset),
    [characters, selectedPreset],
  );
  const deployed = useMemo(
    () => FORMATION_ORDER.filter((slot) => slot !== "banquillo").flatMap((slot) => grouped[slot]),
    [grouped],
  );

  const totalCommand = sumStat(deployed, "command");
  const totalDiscipline = sumStat(deployed, "discipline");
  const totalVigor = sumStat(deployed, "vigor");
  const avgFatigue =
    deployed.length === 0
      ? 0
      : Math.round(deployed.reduce((total, character) => total + character.fatigue, 0) / deployed.length);
  const exhaustedCount = deployed.filter((character) => character.fatigue > 75).length;

  function applyPreset(preset: TercioFormationPreset) {
    setSelectedId(preset.id);
    for (const character of characters) {
      const slot = preset.assignments[character.id as keyof typeof preset.assignments] ?? "banquillo";
      if (character.formationSlot !== slot) setFormationSlot(character.id, slot);
    }
    playPageSound();
  }

  return (
    <div className="relative isolate overflow-hidden rounded-xs border border-iron/70 bg-stone-950/72 shadow-2xl">
      <Backdrop />
      <Header
        preset={selectedPreset}
        totalCommand={totalCommand}
        totalDiscipline={totalDiscipline}
        totalVigor={totalVigor}
        avgFatigue={avgFatigue}
      />

      {exhaustedCount > 0 && (
        <div className="mx-3 mt-2 rounded-xs border border-danger/45 bg-danger/10 px-2 py-1 text-[10px] font-mono text-danger">
          {exhaustedCount} {exhaustedCount === 1 ? "hombre agotado" : "hombres agotados"} en linea.
        </div>
      )}

      <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <FormationPreview grouped={grouped} preset={selectedPreset} />
        <PresetPanel
          selectedId={selectedId}
          activePresetId={activePresetId}
          onApply={applyPreset}
        />
      </div>

      <footer className="relative flex items-end justify-between gap-2 border-t border-stone-700/45 px-3 py-2">
        <p className="font-serif text-[10px] italic text-stone-400/90">
          Solo se forma con ordenanzas cerradas. Diez doctrinas disponibles, ninguna fila libre.
        </p>
        <Image
          src={reportAssetPaths.waxSeal}
          alt=""
          width={64}
          height={64}
          aria-hidden="true"
          className="pointer-events-none h-9 w-9 shrink-0 opacity-30 mix-blend-multiply"
        />
      </footer>
    </div>
  );
}

function Header({
  preset,
  totalCommand,
  totalDiscipline,
  totalVigor,
  avgFatigue,
}: {
  preset: TercioFormationPreset;
  totalCommand: number;
  totalDiscipline: number;
  totalVigor: number;
  avgFatigue: number;
}) {
  const DoctrineIcon = DOCTRINE_ICON[preset.doctrine];
  const sceneSeal = getAssetPathById("tercio_lluvia_con_estandarte");

  return (
    <header className="relative mx-3 mt-2 overflow-hidden border border-amber-950/70 bg-gradient-to-b from-[#6f1712] via-stone-900/75 to-[#2b0907] shadow-[0_8px_18px_rgba(0,0,0,0.55),inset_0_0_24px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <span className="font-mono text-[8px] uppercase tracking-[0.34em] text-amber-200/70">
            Real Cuerpo
          </span>
          <h1 className="mt-1 font-cinzel text-base font-bold uppercase tracking-[0.16em] text-amber-50">
            Tercio - Formacion tipada
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-xs border px-2 py-1 font-mono text-[10px] font-bold uppercase ${DOCTRINE_STYLE[preset.doctrine]}`}>
              <DoctrineIcon className="h-3 w-3" aria-hidden="true" />
              {DOCTRINE_LABEL[preset.doctrine]}
            </span>
            <span className="font-serif text-[11px] italic text-amber-100/80">{preset.bestFor}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Metric statId="command" label="Mando" value={totalCommand} tone="gold" />
          <Metric statId="discipline" label="Disc" value={totalDiscipline} tone="stone" />
          <Metric statId="vigor" label="Vig" value={totalVigor} tone="stone" />
          <Tooltip content={`Fatiga media del tercio en formacion: ${avgFatigue}/100.`}>
            <span
              className={`flex items-center gap-1 rounded-xs border px-2 py-1 font-mono text-[10px] font-bold ${
                avgFatigue > 60
                  ? "border-danger/45 bg-danger/12 text-danger"
                  : avgFatigue > 30
                    ? "border-ember/50 bg-ember/12 text-ember"
                    : "border-success/40 bg-success/12 text-success"
              }`}
            >
              <UiAssetIcon id="fatigue" label="Fatiga" className="h-3 w-3" />
              <span>{avgFatigue}/100</span>
            </span>
          </Tooltip>
        </div>
      </div>

      {sceneSeal && (
        <Image
          src={sceneSeal}
          alt=""
          width={160}
          height={160}
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 hidden h-14 w-14 -translate-y-1/2 rounded-full border border-amber-200/25 object-cover opacity-45 mix-blend-luminosity sm:block"
        />
      )}
    </header>
  );
}

function Metric({
  statId,
  label,
  value,
  tone,
}: {
  statId: keyof Stats;
  label: string;
  value: number;
  tone: "gold" | "stone";
}) {
  return (
    <Tooltip type="stat" statId={statId}>
      <span
        className={`flex items-center gap-1 rounded-xs border px-2 py-1 font-mono text-[10px] font-bold ${
          tone === "gold"
            ? "border-amber-900/45 bg-amber-950/30 text-amber-200"
            : "border-stone-700/70 bg-stone-900/55 text-amber-100/85"
        }`}
      >
        <span className="text-[8px] uppercase text-stone-400">{label}</span>
        <span>{value}</span>
      </span>
    </Tooltip>
  );
}

function PresetPanel({
  selectedId,
  activePresetId,
  onApply,
}: {
  selectedId: TercioFormationPresetId;
  activePresetId: TercioFormationPresetId | null;
  onApply: (preset: TercioFormationPreset) => void;
}) {
  return (
    <aside className="rounded-xs border border-stone-700/55 bg-stone-900/82 p-2 shadow-inner">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-stone-700/55 pb-2">
        <h2 className="font-cinzel text-[12px] font-bold uppercase tracking-[0.14em] text-amber-100">
          Ordenanzas
        </h2>
        <span className="font-mono text-[9px] font-bold uppercase text-stone-400">
          {TERCIO_FORMATION_PRESETS.length}/10
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {TERCIO_FORMATION_PRESETS.map((preset, index) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            index={index + 1}
            selected={selectedId === preset.id}
            active={activePresetId === preset.id}
            onClick={() => onApply(preset)}
          />
        ))}
      </div>
    </aside>
  );
}

function PresetCard({
  preset,
  index,
  selected,
  active,
  onClick,
}: {
  preset: TercioFormationPreset;
  index: number;
  selected: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const DoctrineIcon = DOCTRINE_ICON[preset.doctrine];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-[86px] rounded-xs border p-2 text-left transition-all ${
        selected
          ? "border-amber-200/75 bg-amber-100/10 shadow-[0_0_0_1px_rgba(232,213,170,0.3)]"
          : "border-stone-700/65 bg-stone-950/48 hover:border-amber-400/45 hover:bg-stone-900/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xs border border-amber-900/45 bg-stone-950/60 shadow-inner">
          <Image
            src={tercioOrdinanceIconPaths[preset.id]}
            alt=""
            width={64}
            height={64}
            aria-hidden="true"
            className="h-10 w-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]"
          />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] font-bold text-amber-300/75">
              {String(index).padStart(2, "0")}
            </span>
            <span className="truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.08em] text-amber-100">
              {preset.name}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-stone-400">
            {preset.description}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-xs border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${DOCTRINE_STYLE[preset.doctrine]}`}>
          <DoctrineIcon className="h-3 w-3" aria-hidden="true" />
          {preset.shortName}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate font-serif text-[10px] italic text-stone-500">{preset.bestFor}</span>
        {active && (
          <span className="inline-flex items-center gap-1 rounded-xs border border-success/40 bg-success/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-success">
            <Check className="h-3 w-3" aria-hidden="true" />
            Activa
          </span>
        )}
      </div>
    </button>
  );
}

function FormationPreview({
  grouped,
  preset,
}: {
  grouped: Record<FormationSlot, CharacterState[]>;
  preset: TercioFormationPreset;
}) {
  const previewOrder: FormationSlot[] = ["retaguardia", "apoyo", "fuego", "vanguardia", "banquillo"];

  return (
    <section className="overflow-hidden rounded-xs border border-stone-700/55 bg-stone-950/65 shadow-inner">
      <div className="relative overflow-hidden bg-[#213514]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{ backgroundImage: `url("${FORMATION_FIELD_BG}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(20,28,12,0.05) 0%, rgba(0,0,0,0.16) 58%, rgba(0,0,0,0.52) 100%)",
          }}
        />

        <div className="relative z-20 m-3 rounded-xs border border-stone-800/45 bg-stone-950/76 px-3 py-2 shadow-lg backdrop-blur-[2px]">
          <h2 className="font-cinzel text-[12px] font-bold uppercase tracking-[0.16em] text-amber-100">
            {preset.name}
          </h2>
          <p className="mt-1 font-serif text-[11px] italic text-stone-300">{preset.description}</p>
        </div>

        <div className="relative z-10 grid gap-2 px-4 pb-4">
          {previewOrder.map((slot) => (
            <FormationLane key={slot} slot={slot} characters={grouped[slot]} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FormationLane({
  slot,
  characters,
}: {
  slot: FormationSlot;
  characters: CharacterState[];
}) {
  const meta = FORMATION_META[slot];
  const { Icon, preferredStat } = meta;

  return (
    <section className="relative min-h-[104px] rounded-xs border border-stone-700/55 bg-stone-950/46 px-2 pb-2 pt-8 shadow-[inset_0_0_24px_rgba(0,0,0,0.25)]">
      <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-xs border border-stone-700/55 bg-stone-950/78 px-2 py-1">
        <Image
          src={formationRoleIconPaths[slot]}
          alt=""
          width={32}
          height={32}
          aria-hidden="true"
          className="h-5 w-5 object-contain"
        />
        <Icon className="h-3 w-3 text-amber-200/65" aria-hidden="true" />
        <span className="truncate font-cinzel text-[10px] font-bold uppercase tracking-wider text-amber-100">
          {meta.label}
        </span>
        <span className="font-mono text-[8px] text-stone-500">{characters.length}</span>
        {preferredStat && (
          <span className="rounded-xs border border-stone-700/55 px-1 font-mono text-[7px] font-bold uppercase text-stone-300">
            {COMBAT_STAT_LABEL[preferredStat]}
          </span>
        )}
      </div>

      <div className="flex min-h-[70px] flex-wrap items-end justify-center gap-2">
        {characters.length === 0 ? (
          <div className="mb-3 rounded-xs border border-dashed border-stone-600/50 bg-stone-950/45 px-3 py-2 font-serif text-[10px] italic text-stone-500">
            Vacio
          </div>
        ) : (
          characters.map((character) => (
            <FormationToken key={character.id} character={character} slot={slot} />
          ))
        )}
      </div>
    </section>
  );
}

function FormationToken({
  character,
  slot,
}: {
  character: CharacterState;
  slot: FormationSlot;
}) {
  const portraitSrc = getAssetPathById(character.portraitAssetId);
  const fit = getFitState(character, slot);
  const ring =
    fit === "encaja"
      ? "border-success/55 bg-success/12"
      : fit === "fuera_de_rol"
        ? "border-ember/55 bg-ember/12"
        : "border-stone-600/60 bg-stone-800/40";

  return (
    <article className="relative flex w-[76px] flex-col items-center">
      <div
        aria-hidden="true"
        className={`absolute bottom-7 h-9 w-20 rounded-[50%] border-4 shadow-[0_0_18px_rgba(62,136,255,0.18)] ${ring}`}
        style={{ transform: "perspective(240px) rotateX(64deg)" }}
      />
      <div className="relative z-10 h-16 w-16 overflow-hidden rounded-full border border-amber-200/35 bg-stone-900 shadow-lg">
        {portraitSrc ? (
          <Image
            src={portraitSrc}
            alt={character.name}
            width={128}
            height={128}
            className="h-full w-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-stone-500">
            {character.name.slice(0, 2)}
          </div>
        )}
      </div>
      <span className="relative z-10 mt-1 max-w-full truncate rounded-xs border border-stone-700/60 bg-stone-950/78 px-1.5 py-0.5 text-center font-mono text-[8px] font-bold uppercase text-amber-100">
        {character.id === PLAYER_ID ? "Diego" : character.name.split(" ")[0]}
      </span>
    </article>
  );
}

function Backdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(120,56,22,0.32) 0%, rgba(60,24,8,0.18) 35%, rgba(10,8,6,0) 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 95% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </>
  );
}
