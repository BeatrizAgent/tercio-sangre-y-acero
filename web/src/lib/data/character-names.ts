// character-names.ts — static seed for the /login name generator and the
// GET /api/character-names stub. The data lives in
// data/character-names.json (synced to web/data/json/character-names.json
// by web/scripts/sync-data.mjs). When the backend is wired up, this
// wrapper will fetch from /api/character-names and fall back to the
// static import for local dev.

import characterNamesJson from "../../../data/json/character-names.json";

export interface CharacterNamesData {
  version: number;
  locale: string;
  era: string;
  region: string;
  description: string;
  firstNames: string[];
  surnames: string[];
}

const data = characterNamesJson as CharacterNamesData;

export const characterNames: CharacterNamesData = data;

export function getFirstNames(): readonly string[] {
  return data.firstNames;
}

export function getSurnames(): readonly string[] {
  return data.surnames;
}
