// Character roster data (NPC definitions used to seed the company) plus the
// per-save `createCharacterStates` helper. The static `spriteSetDefinitions`
// (Diego's animation sheet) lives here too because it is character data.

import charactersJson from "../../../data/json/characters.json";
import type { CharacterDefinition, CharacterState, SpriteSetDefinition } from "../types";

export const characterDefinitions = charactersJson as CharacterDefinition[];

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

export function getSpriteSetDefinition(spriteSetId: string | undefined) {
  if (!spriteSetId) return undefined;
  return spriteSetDefinitions.find((spriteSet) => spriteSet.id === spriteSetId);
}
