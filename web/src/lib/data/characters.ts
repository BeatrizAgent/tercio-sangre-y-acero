// Character roster data. Backed by the unified catalog; the static
// `spriteSetDefinitions` (Diego's animation sheet) lives here too because
// it is character data. Recruitment candidates that don't have full
// catalog entries remain inline (they're flavor NPCs, not the main roster).

import {
  characterDefinitions as catalogCharacters,
  getCharacter as catalogGetCharacter,
} from "./catalog";
import type { CharacterDefinition, CharacterState, SpriteSetDefinition } from "../types";

// Bridge catalog characters -> legacy CharacterDefinition shape. The legacy
// shape requires `formationSlot`, `fatigue`, and `equipment`; catalog
// characters don't have those. We use safe defaults.
export const characterDefinitions: CharacterDefinition[] = catalogCharacters.map((c) => ({
  id: c.id,
  name: c.name,
  role: c.role,
  rank: c.rankId,
  portraitAssetId: c.portraitAssetId,
  formationSlot: "banquillo" as const,
  fatigue: 0,
  stats: c.stats as CharacterDefinition["stats"],
  equipment: {
    head: null,
    body: null,
    mainHand: null,
    offHand: null,
    firearm: null,
    accessory: null,
    boots: null,
    consumable: null,
  },
}));

export const spriteSetDefinitions: SpriteSetDefinition[] = [
  {
    id: "diego_pike",
    name: "Diego con pica",
    frames: {
      walk: {
        assetId: "diego_sprite_caminar",
        frameWidth: 2031 / 3,
        frameHeight: 714,
        frames: 3,
        fps: 6,
      },
      pikeAttack: {
        assetId: "diego_sprite_ataque_pica",
        frameWidth: 2076 / 3,
        frameHeight: 570,
        frames: 3,
        fps: 5,
      },
      swordAttack: {
        assetId: "diego_sprite_golpe_espada",
        frameWidth: 2141 / 3,
        frameHeight: 642,
        frames: 3,
        fps: 5,
      },
    },
  },
];

export function createCharacterStates(): CharacterState[] {
  return characterDefinitions.map((character) => ({
    ...character,
    stats: { ...character.stats },
    equipment: { ...character.equipment },
    unlocked: true,
  }));
}

export function getCharacterDefinition(characterId: string | undefined) {
  if (!characterId) return undefined;
  return characterDefinitions.find((character) => character.id === characterId);
}

export { catalogGetCharacter as getCharacter };

export function getSpriteSetDefinition(spriteSetId: string | undefined) {
  if (!spriteSetId) return undefined;
  return spriteSetDefinitions.find((spriteSet) => spriteSet.id === spriteSetId);
}
