// player-portraits.ts — curado de retratos seleccionables en el creador
// de personaje de /login. La fuente de verdad es data/player-portraits.json
// (sincronizado desde data/catalog.json por
// scripts/build_player_portraits.mjs). Cuando se anadan retratos nuevos
// al catalog, re-ejecutar el script y volver a sincronizar.

import playerPortraitsJson from "../../../data/json/player-portraits.json";

export type PlayerPortraitRole =
  | "recruit"
  | "pikeman"
  | "swordsman"
  | "arquebusier"
  | "officer"
  | "guard"
  | "veteran"
  | "specialist"
  | "scout"
  | "sailor";

export interface PlayerPortraitOption {
  id: string;
  displayName: string;
  role: PlayerPortraitRole;
  roleLabel: string;
  publicPath: string;
  width: number;
  height: number;
}

export interface PlayerPortraitsData {
  version: number;
  description: string;
  options: PlayerPortraitOption[];
}

const data = playerPortraitsJson as PlayerPortraitsData;

export const playerPortraitOptions: readonly PlayerPortraitOption[] = data.options;

const VALID_IDS = new Set(data.options.map((option) => option.id));

export function getPlayerPortraitOptions(): readonly PlayerPortraitOption[] {
  return playerPortraitOptions;
}

export function getPlayerPortraitById(id: string | undefined): PlayerPortraitOption | undefined {
  if (!id) return undefined;
  return data.options.find((option) => option.id === id);
}

export function isValidPlayerPortraitId(id: string | undefined): id is string {
  if (!id) return false;
  return VALID_IDS.has(id);
}

export function getDefaultPlayerPortraitId(): string {
  return data.options[0]?.id ?? "";
}
