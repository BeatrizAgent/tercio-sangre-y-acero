// Wound definitions and lookup. Backed by the unified catalog.

import {
  woundDefinitions as catalogWounds,
  getWound as catalogGetWound,
} from "./catalog";
import type { WoundDefinition } from "../types";

// Bridge catalog wounds -> legacy WoundDefinition shape (severity as number).
export const woundDefinitions: readonly WoundDefinition[] = catalogWounds.map((w) => {
  const severityMap: Record<string, number> = {
    minor: 1,
    moderate: 2,
    serious: 3,
    grave: 4,
  };
  return {
    id: w.id,
    name: w.name,
    severity: severityMap[w.severity] ?? 1,
    effects: w.effects,
    description: w.description,
    treatmentItems: [...w.treatmentItems],
  };
});

export function getWound(woundId: string) {
  return woundDefinitions.find((w) => w.id === woundId);
}
