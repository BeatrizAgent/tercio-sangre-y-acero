"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import type { CharacterState, FormationSlot, Stats } from "@/lib/types";
import { useGameStore } from "@/lib/game-store";
import {
  DEFAULT_TERCIO_FORMATION_ID,
  FORMATION_ORDER,
  TERCIO_FORMATION_PRESETS,
  type TercioFormationPreset,
  type TercioFormationPresetId,
} from "@/lib/domain/formation";
import { Badge } from "@/components/ui/card";
import { playPageSound } from "@/lib/sounds";
import { tercioOrdinanceIconPaths } from "@/lib/game-data";
import { TercioBattleLine } from "./tercio-battle-line";

const PLAYER_ID = "diego_de_arce";

const DOCTRINE_LABEL: Record<TercioFormationPreset["doctrine"], string> = {
  pica: "Pica",
  fuego: "Fuego",
  defensa: "Defensa",
  marcha: "Marcha",
  asalto: "Asalto",
};

function sumStat(characters: CharacterState[], key: keyof Stats): number {
  return characters.reduce((total, character) => total + character.stats[key], 0);
}

function groupByCurrentSlot(characters: CharacterState[]) {
  const map: Record<FormationSlot, CharacterState[]> = {
    vanguardia: [],
    fuego: [],
    apoyo: [],
    retaguardia: [],
    banquillo: [],
  };

  for (const character of characters) {
    map[character.formationSlot].push(character);
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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<TercioFormationPresetId>(
    activePresetId ?? DEFAULT_TERCIO_FORMATION_ID,
  );

  const selectedPreset = useMemo(
    () => TERCIO_FORMATION_PRESETS.find((preset) => preset.id === selectedId) ?? TERCIO_FORMATION_PRESETS[0],
    [selectedId],
  );

  const grouped = useMemo(
    () => groupByCurrentSlot(characters),
    [characters],
  );

  const deployed = useMemo(
    () => FORMATION_ORDER.filter((slot) => slot !== "banquillo").flatMap((slot) => grouped[slot]),
    [grouped],
  );

  const avgFatigue =
    deployed.length === 0
      ? 0
      : Math.round(deployed.reduce((total, character) => total + character.fatigue, 0) / deployed.length);

  function applyPreset(preset: TercioFormationPreset) {
    setSelectedId(preset.id);
    for (const character of characters) {
      const slot = preset.assignments[character.id as keyof typeof preset.assignments] ?? "banquillo";
      if (character.formationSlot !== slot) setFormationSlot(character.id, slot);
    }
    playPageSound();
  }

  function moveCharacter(characterId: string, targetSlot: FormationSlot) {
    setSelectedId(activePresetId ?? selectedId);
    setFormationSlot(characterId, targetSlot);
    playPageSound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-col gap-3 border-b border-iron pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-cinzel text-3xl font-extrabold uppercase tracking-wider text-gold">
            Tercio
          </h1>
          <p className="mt-1 text-xs font-mono uppercase text-muted">
            {selectedPreset.name} | {DOCTRINE_LABEL[selectedPreset.doctrine]}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase">
          <SummaryChip label="Mando" value={sumStat(deployed, "command")} />
          <SummaryChip label="Disciplina" value={sumStat(deployed, "discipline")} />
          <SummaryChip label="Fatiga" value={`${avgFatigue}/100`} />
        </div>
      </header>

      <section className="game-panel rounded-xs p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-cinzel text-lg font-bold uppercase text-gold-soft">Ordenanza</h2>
          {activePresetId === selectedId ? <Badge variant="success">Activa</Badge> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {TERCIO_FORMATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`min-h-20 rounded-xs border p-2 text-left transition-all ${
                selectedId === preset.id
                  ? "border-gold bg-gold/10 text-text"
                  : "border-iron bg-stone-950/55 text-text-muted hover:border-gold/45 hover:text-text"
              }`}
            >
              <span className="flex items-center gap-2">
                <Image
                  src={tercioOrdinanceIconPaths[preset.id]}
                  alt=""
                  width={40}
                  height={40}
                  className="h-9 w-9 shrink-0 rounded-xs border border-iron/70 bg-stone-950/80 object-contain p-1"
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block truncate font-cinzel text-xs font-bold uppercase text-gold-soft">
                    {preset.shortName}
                  </span>
                  <span className="mt-1 block text-[10px] font-mono uppercase">
                    {DOCTRINE_LABEL[preset.doctrine]}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="game-panel rounded-xs p-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-cinzel text-lg font-bold uppercase text-gold-soft">Linea</h2>
          <p className="text-xs font-mono uppercase text-muted">{selectedPreset.bestFor}</p>
        </div>

        <TercioBattleLine
          grouped={grouped}
          playerId={PLAYER_ID}
          draggedId={draggedId}
          onDrop={moveCharacter}
          onDragStateChange={setDraggedId}
        />
      </section>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="rounded-xs border border-iron bg-stone-900 px-2 py-1 text-muted">
      {label} <strong className="text-gold">{value}</strong>
    </span>
  );
}
