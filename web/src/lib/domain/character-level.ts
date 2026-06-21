import type { Stats } from "@/lib/types";

export function getCharacterLevel(stats: Stats): number {
  return Object.values(stats).reduce((total, value) => total + value, 0);
}
