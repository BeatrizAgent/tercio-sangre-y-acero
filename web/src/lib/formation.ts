// Shared formation metadata for /company (drag board) and /soldier (picker).
// Centralizes slot names, role labels, flavor copy, and the stat each slot prefers.

import {
  Crosshair,
  Flag,
  Footprints,
  HandHelping,
  Tent,
  type LucideIcon,
} from "lucide-react";
import type { CharacterState, FormationSlot, StatId, Stats } from "./types";

export const FORMATION_CHARACTER_IDS = [
  "diego_de_arce",
  "lope_de_saavedra",
  "martin_de_cuenca",
  "alonso_de_valdes",
  "sancho_de_leiva",
] as const;

export type FormationCharacterId = (typeof FORMATION_CHARACTER_IDS)[number];
export type FormationDoctrine = "pica" | "fuego" | "defensa" | "marcha" | "asalto";
export type TercioFormationPresetId =
  | "cuadro_de_picas"
  | "manga_de_fuego"
  | "escuadron_defensivo"
  | "avance_de_socorro"
  | "escolta_del_estandarte"
  | "emboscada_de_arcabuces"
  | "columna_de_marcha"
  | "guardia_de_bagajes"
  | "asalto_de_brecha"
  | "reserva_cerrada";

export interface TercioFormationPreset {
  id: TercioFormationPresetId;
  name: string;
  shortName: string;
  doctrine: FormationDoctrine;
  description: string;
  bestFor: string;
  assignments: Record<FormationCharacterId, FormationSlot>;
}

export interface FormationMeta {
  slot: FormationSlot;
  label: string;
  role: string;
  flavor: string;
  Icon: LucideIcon;
  preferredStat: StatId | null;
}

export const FORMATION_META: Record<FormationSlot, FormationMeta> = {
  vanguardia: {
    slot: "vanguardia",
    label: "Vanguardia",
    role: "Cabo de pica",
    flavor: "Picas adelantadas. Quien cae aqui, marca el paso.",
    Icon: Footprints,
    preferredStat: "pike",
  },
  fuego: {
    slot: "fuego",
    label: "Fuego",
    role: "Cabo de fuego",
    flavor: "Arcabuceros. Disparan por encima de las picas.",
    Icon: Crosshair,
    preferredStat: "arquebus",
  },
  apoyo: {
    slot: "apoyo",
    label: "Apoyo",
    role: "Cabo de apoyo",
    flavor: "Reservas, aguadores, cirjanos de linea.",
    Icon: HandHelping,
    preferredStat: "discipline",
  },
  retaguardia: {
    slot: "retaguardia",
    label: "Retaguardia",
    role: "Cabo de estandarte",
    flavor: "Estandarte, oficiales, ultima linea.",
    Icon: Flag,
    preferredStat: "command",
  },
  banquillo: {
    slot: "banquillo",
    label: "Banquillo",
    role: "Reserva",
    flavor: "Sin puesto fijo. Descansa o releva.",
    Icon: Tent,
    preferredStat: null,
  },
};

export const FORMATION_ORDER: FormationSlot[] = [
  "vanguardia",
  "fuego",
  "apoyo",
  "retaguardia",
  "banquillo",
];

export const TERCIO_FORMATION_PRESETS: readonly TercioFormationPreset[] = [
  {
    id: "cuadro_de_picas",
    name: "Cuadro de picas",
    shortName: "Picas",
    doctrine: "pica",
    description: "Picas al frente, fuego en costado y estandarte atras.",
    bestFor: "Aguantar carga frontal.",
    assignments: {
      diego_de_arce: "vanguardia",
      sancho_de_leiva: "vanguardia",
      lope_de_saavedra: "fuego",
      martin_de_cuenca: "apoyo",
      alonso_de_valdes: "retaguardia",
    },
  },
  {
    id: "manga_de_fuego",
    name: "Manga de fuego",
    shortName: "Fuego",
    doctrine: "fuego",
    description: "Arcabuces mandan. Picas cubren retirada corta.",
    bestFor: "Hostigar sin trabarse.",
    assignments: {
      diego_de_arce: "apoyo",
      sancho_de_leiva: "vanguardia",
      lope_de_saavedra: "fuego",
      martin_de_cuenca: "fuego",
      alonso_de_valdes: "retaguardia",
    },
  },
  {
    id: "escuadron_defensivo",
    name: "Escuadron defensivo",
    shortName: "Defensa",
    doctrine: "defensa",
    description: "Mando cerrado, apoyo cerca y picas quietas.",
    bestFor: "Resistir con fatiga alta.",
    assignments: {
      diego_de_arce: "vanguardia",
      sancho_de_leiva: "vanguardia",
      lope_de_saavedra: "retaguardia",
      martin_de_cuenca: "apoyo",
      alonso_de_valdes: "apoyo",
    },
  },
  {
    id: "avance_de_socorro",
    name: "Avance de socorro",
    shortName: "Socorro",
    doctrine: "marcha",
    description: "Columna compacta para entrar rapido donde falta ayuda.",
    bestFor: "Llegar pronto y no romper linea.",
    assignments: {
      diego_de_arce: "vanguardia",
      sancho_de_leiva: "apoyo",
      lope_de_saavedra: "fuego",
      martin_de_cuenca: "apoyo",
      alonso_de_valdes: "retaguardia",
    },
  },
  {
    id: "escolta_del_estandarte",
    name: "Escolta del estandarte",
    shortName: "Estandarte",
    doctrine: "defensa",
    description: "El mando queda protegido. Nadie corre sin orden.",
    bestFor: "Mantener honor y disciplina.",
    assignments: {
      diego_de_arce: "vanguardia",
      sancho_de_leiva: "apoyo",
      lope_de_saavedra: "fuego",
      martin_de_cuenca: "retaguardia",
      alonso_de_valdes: "retaguardia",
    },
  },
  {
    id: "emboscada_de_arcabuces",
    name: "Emboscada de arcabuces",
    shortName: "Emboscada",
    doctrine: "fuego",
    description: "Fuego adelantado y picas listas para cerrar la trampa.",
    bestFor: "Golpear primero.",
    assignments: {
      diego_de_arce: "apoyo",
      sancho_de_leiva: "vanguardia",
      lope_de_saavedra: "vanguardia",
      martin_de_cuenca: "fuego",
      alonso_de_valdes: "retaguardia",
    },
  },
  {
    id: "columna_de_marcha",
    name: "Columna de marcha",
    shortName: "Marcha",
    doctrine: "marcha",
    description: "Orden simple para camino, barro y poca visibilidad.",
    bestFor: "Moverse con bajas sorpresas.",
    assignments: {
      diego_de_arce: "vanguardia",
      sancho_de_leiva: "apoyo",
      lope_de_saavedra: "fuego",
      martin_de_cuenca: "retaguardia",
      alonso_de_valdes: "retaguardia",
    },
  },
  {
    id: "guardia_de_bagajes",
    name: "Guardia de bagajes",
    shortName: "Bagajes",
    doctrine: "defensa",
    description: "Protege paga, vendas y polvora antes que gloria.",
    bestFor: "Reducir riesgo de saqueo.",
    assignments: {
      diego_de_arce: "apoyo",
      sancho_de_leiva: "vanguardia",
      lope_de_saavedra: "fuego",
      martin_de_cuenca: "retaguardia",
      alonso_de_valdes: "apoyo",
    },
  },
  {
    id: "asalto_de_brecha",
    name: "Asalto de brecha",
    shortName: "Brecha",
    doctrine: "asalto",
    description: "Acero delante. Fuego cubre el hueco y nadie mira atras.",
    bestFor: "Misiones duras y cortas.",
    assignments: {
      diego_de_arce: "vanguardia",
      sancho_de_leiva: "vanguardia",
      lope_de_saavedra: "fuego",
      martin_de_cuenca: "banquillo",
      alonso_de_valdes: "apoyo",
    },
  },
  {
    id: "reserva_cerrada",
    name: "Reserva cerrada",
    shortName: "Reserva",
    doctrine: "defensa",
    description: "Un hombre descansa. El resto guarda fuerza.",
    bestFor: "Bajar desgaste antes de salir.",
    assignments: {
      diego_de_arce: "vanguardia",
      sancho_de_leiva: "apoyo",
      lope_de_saavedra: "fuego",
      martin_de_cuenca: "banquillo",
      alonso_de_valdes: "retaguardia",
    },
  },
] as const;

export const DEFAULT_TERCIO_FORMATION_ID: TercioFormationPresetId = "cuadro_de_picas";

export function getFormationPreset(id: TercioFormationPresetId): TercioFormationPreset {
  return TERCIO_FORMATION_PRESETS.find((preset) => preset.id === id) ?? TERCIO_FORMATION_PRESETS[0];
}

export const COMBAT_STAT_LABEL: Record<StatId, string> = {
  pike: "Pica",
  sword: "Espada",
  arquebus: "Arcabuz",
  discipline: "Disciplina",
  vigor: "Vigor",
  cunning: "Astucia",
  command: "Mando",
};

const KEY_STATS: StatId[] = ["pike", "sword", "arquebus", "discipline", "command"];

export function pickTopStat(stats: Stats): StatId {
  let best: StatId = "discipline";
  let bestVal = -1;
  for (const key of KEY_STATS) {
    if (stats[key] > bestVal) {
      best = key;
      bestVal = stats[key];
    }
  }
  return best;
}

function topStats(stats: Stats, count: number): Set<StatId> {
  const entries = (Object.entries(stats) as [StatId, number][])
    .sort((a, b) => b[1] - a[1]);
  return new Set(entries.slice(0, count).map(([key]) => key));
}

export type FitState = "encaja" | "fuera_de_rol" | "banquillo";

export function getFitState(character: CharacterState, slot: FormationSlot): FitState {
  const preferred = FORMATION_META[slot].preferredStat;
  if (!preferred) return "banquillo";
  return topStats(character.stats, 2).has(preferred) ? "encaja" : "fuera_de_rol";
}

// An NCO is "in stress" when they're benched, in the wrong row, or gassed out.
// Used to swap the static tercio sprite for the emotion variant.
export function isNCOInStress(character: CharacterState): boolean {
  if (character.formationSlot === "banquillo") return true;
  if (character.fatigue > 75) return true;
  return getFitState(character, character.formationSlot) === "fuera_de_rol";
}
