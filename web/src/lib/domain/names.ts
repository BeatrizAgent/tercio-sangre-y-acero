// names.ts — domain helpers for the /login character creator.
//
// Today: pulls the static list from data/character-names.json and rolls a
// random "Nombre de Apellido" matching the catalog onomastics (Diego de
// Arce, Juan de Lerma, ...).
//
// Later: swap generateCharacterName() to fetch from GET /api/character-names
// so the pool can be curated server-side without shipping a new client.

import { getFirstNames, getSurnames } from "../data/character-names";
import type { CharacterNamesData } from "../data/character-names";

export interface GeneratedCharacterName {
  firstName: string;
  surname: string;
  fullName: string;
}

export function normalizeCharacterName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("es-ES");
}

export function findDuplicateNames(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    const normalized = normalizeCharacterName(value);
    if (seen.has(normalized)) {
      duplicates.add(normalized);
    }
    seen.add(normalized);
  }

  return [...duplicates].sort((a, b) => a.localeCompare(b, "es-ES"));
}

export function validateCharacterNamePools(data: Pick<CharacterNamesData, "firstNames" | "surnames">) {
  const duplicateFirstNames = findDuplicateNames(data.firstNames);
  const duplicateSurnames = findDuplicateNames(data.surnames);

  if (duplicateFirstNames.length > 0 || duplicateSurnames.length > 0) {
    throw new Error(
      [
        duplicateFirstNames.length > 0 ? `firstNames duplicates: ${duplicateFirstNames.join(", ")}` : null,
        duplicateSurnames.length > 0 ? `surnames duplicates: ${duplicateSurnames.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("; "),
    );
  }
}

function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error("character-names pool is empty");
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export function generateCharacterName(): GeneratedCharacterName {
  const firstName = pickRandom(getFirstNames());
  const surname = pickRandom(getSurnames());
  return {
    firstName,
    surname,
    fullName: `${firstName} de ${surname}`,
  };
}
