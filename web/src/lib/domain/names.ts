// names.ts — domain helpers for the /login character creator.
//
// Today: pulls the static list from data/character-names.json and rolls a
// random "Nombre de Apellido" matching the catalog onomastics (Diego de
// Arce, Juan de Lerma, ...).
//
// Later: swap generateCharacterName() to fetch from GET /api/character-names
// so the pool can be curated server-side without shipping a new client.

import { getFemaleFirstNames, getFirstNames, getSurnames } from "../data/character-names";
import type { CharacterNamesData } from "../data/character-names";
import type { FamilyBackground, RelativeContext } from "../types";

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

export function generateFamilyBackground(soldierName: string): FamilyBackground {
  // Extract surname from soldierName (e.g. "Diego de Arce" -> "de Arce" or "Diego Arce" -> "Arce")
  const nameParts = soldierName.trim().split(/\s+/);
  let soldierSurname = "Arce"; // Fallback
  if (nameParts.length > 1) {
    if (nameParts.length > 2 && nameParts[nameParts.length - 2].toLowerCase() === "de") {
      soldierSurname = "de " + nameParts[nameParts.length - 1];
    } else {
      soldierSurname = nameParts[nameParts.length - 1];
    }
  }

  const femaleFirstNames = getFemaleFirstNames();
  const maleFirstNames = getFirstNames();
  const surnamesPool = getSurnames();

  // Helper to pick random name that doesn't conflict with soldier's first name
  const soldierFirstName = nameParts[0] || "Diego";
  const pickMaleFirstName = (exclude: string[] = []) => {
    let name = pickRandom(maleFirstNames);
    let attempts = 0;
    while ((name === soldierFirstName || exclude.includes(name)) && attempts < 50) {
      name = pickRandom(maleFirstNames);
      attempts++;
    }
    return name;
  };

  const pickFemaleFirstName = (exclude: string[] = []) => {
    let name = pickRandom(femaleFirstNames);
    let attempts = 0;
    while (exclude.includes(name) && attempts < 50) {
      name = pickRandom(femaleFirstNames);
      attempts++;
    }
    return name;
  };

  const pickSurname = (exclude: string[] = []) => {
    let s = pickRandom(surnamesPool);
    let attempts = 0;
    while (exclude.includes(s) && attempts < 50) {
      s = pickRandom(surnamesPool);
      attempts++;
    }
    return `de ${s}`;
  };

  const brotherFirstName = pickMaleFirstName();
  const fatherFirstName = pickMaleFirstName([brotherFirstName]);
  const grandfatherFirstName = pickMaleFirstName([brotherFirstName, fatherFirstName]);
  const motherFirstName = pickFemaleFirstName();
  const loveInterestFirstName = pickFemaleFirstName([motherFirstName]);

  const motherSurname = pickSurname();
  const loveInterestSurname = pickSurname([motherSurname]);

  return {
    mother: {
      name: `${motherFirstName} ${motherSurname}`,
      relation: "mother",
      portraitId: "/assets/gpt-bank/portraits/npcs/vivandera_portrait.png",
      description: "Falleció dándote a luz; de ella solo queda una mantilla gastada y un rosario.",
      status: "deceased",
    },
    brother: {
      name: `${brotherFirstName} ${soldierSurname}`,
      relation: "brother",
      portraitId: "/assets/gpt-bank/portraits/player-options/player_portrait_option_01_bisono_recruit.png",
      description: "Tu hermano pequeño. Decidiste marchar al tercio para librarle de la miseria del campo.",
      status: "living",
    },
    father: {
      name: `${fatherFirstName} ${soldierSurname}`,
      relation: "father",
      portraitId: "/assets/gpt-bank/portraits/npcs/sergeant_instructor_portrait.png",
      description: "Un viudo roto, consumido por el vino agrio y las promesas incumplidas en Castilla.",
      status: "living",
    },
    grandfather: {
      name: `${grandfatherFirstName} ${soldierSurname}`,
      relation: "grandfather",
      portraitId: "/assets/gpt-bank/portraits/player-options/player_portrait_option_16_eyepatch_veteran.png",
      description: "Viejo soldado retirado que sirvió en Flandes. Te entregó sus sabios consejos y su morrión gastado.",
      status: "living",
    },
    love_interest: {
      name: `${loveInterestFirstName} ${loveInterestSurname}`,
      relation: "love_interest",
      portraitId: "/assets/gpt-bank/portraits/npcs/vivandera_portrait.png",
      description: "Te despidió en el camino de Castilla. Guarda tu recuerdo sin prometer esperarte para siempre.",
      status: "living",
    },
  };
}
