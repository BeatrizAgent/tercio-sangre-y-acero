// Wound definitions and lookup.

import { wounds } from "../../../data/seed-wounds";
import type { WoundDefinition } from "../types";

export const woundDefinitions = wounds as readonly WoundDefinition[];

export function getWound(woundId: string) {
  return woundDefinitions.find((wound) => wound.id === woundId);
}
