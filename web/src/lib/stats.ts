// Single source of truth for soldier stat metadata: long names, short labels,
// and tooltips. Consumed by Tooltip (ui/tooltip) and by the soldier profile
// page so the descriptions only live in one place.

import type { StatId } from "./types";

export interface StatInfo {
  /** Full Spanish name used in titles and tooltips. */
  name: string;
  /** Short tag used inside compact chips (e.g. "Disc", "Vig"). */
  short: string;
  /** Player-facing description shown on hover / in the stat panel. */
  description: string;
}

export const STAT_INFO: Record<StatId, StatInfo> = {
  pike: {
    name: "Pica",
    short: "Pica",
    description: "Alcance en formación, resistencia al impacto y empuje de la línea.",
  },
  sword: {
    name: "Espada",
    short: "Espada",
    description: "Combate a corta distancia y violencia cuando la línea se rompe.",
  },
  arquebus: {
    name: "Arcabuz",
    short: "Arcabuz",
    description: "Manejo de armas de fuego bajo el humo, el viento y la lluvia.",
  },
  discipline: {
    name: "Disciplina",
    short: "Disc",
    description: "Mantener la formación, obedecer órdenes y superar el pánico.",
  },
  vigor: {
    name: "Vigor",
    short: "Vig",
    description: "Marcha con peso, aguante físico, curación de heridas y encajar golpes.",
  },
  cunning: {
    name: "Astucia",
    short: "Ast",
    description: "Detectar peligros, esquivar la muerte y ver oportunidades.",
  },
  command: {
    name: "Mando",
    short: "Mando",
    description: "Autoridad sobre otros soldados y moral de la compañía.",
  },
};

/** Short label keyed by StatId, kept separate for ergonomic import sites. */
export const STAT_LABELS: Record<StatId, string> = Object.fromEntries(
  (Object.entries(STAT_INFO) as [StatId, StatInfo][]).map(([id, info]) => [id, info.name]),
) as Record<StatId, string>;
