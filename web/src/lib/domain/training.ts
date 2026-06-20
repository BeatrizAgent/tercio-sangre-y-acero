// Pure training math. Spends coins + xp, gains stat, adds fatigue. Returns
// the next state and an ActionResult. Character training is also exposed
// for the company view.

import { trainingOptions } from "../data/training";
import { fail, ok, type ActionResult } from "./result";
import type { GameState, StatId } from "../types";

const PLAYER_CHARACTER_ID = "diego_de_arce";

export function trainSoldierStatInState(
  state: GameState,
  stat: StatId,
): { next: GameState; result: ActionResult } {
  const option = trainingOptions.find((entry) => entry.stat === stat);
  if (!option) return { next: state, result: fail("Entrenamiento no encontrado.") };
  if (state.soldier.coins < option.cost.coins || state.soldier.xp < option.cost.xp) {
    return { next: state, result: fail("Monedas o experiencia insuficientes.") };
  }
  const soldier = {
    ...state.soldier,
    coins: state.soldier.coins - option.cost.coins,
    xp: state.soldier.xp - option.cost.xp,
    fatigue: Math.min(100, state.soldier.fatigue + option.fatigue),
    stats: { ...state.soldier.stats, [stat]: state.soldier.stats[stat] + option.gain },
  };
  // Mirror the change into the player character entry of the company.
  const characters = state.characters.map((character) =>
    character.id === PLAYER_CHARACTER_ID
      ? {
          ...character,
          rank: soldier.rank,
          fatigue: soldier.fatigue,
          stats: { ...soldier.stats },
          equipment: { ...soldier.equipment },
        }
      : character,
  );
  return {
    next: { ...state, soldier, characters },
    result: ok(`Has completado el entrenamiento: ${option.name}.`),
  };
}

export function trainCharacterStatInState(
  state: GameState,
  characterId: string,
  stat: StatId,
): { next: GameState; result: ActionResult } {
  const option = trainingOptions.find((entry) => entry.stat === stat);
  if (!option) return { next: state, result: fail("Entrenamiento no encontrado.") };
  if (state.soldier.coins < option.cost.coins || state.soldier.xp < option.cost.xp) {
    return { next: state, result: fail("Monedas o experiencia insuficientes.") };
  }
  const character = state.characters.find((entry) => entry.id === characterId);
  if (!character) return { next: state, result: fail("Personaje no encontrado.") };
  const updatedCharacter = {
    ...character,
    fatigue: Math.min(100, character.fatigue + option.fatigue),
    stats: { ...character.stats, [stat]: character.stats[stat] + option.gain },
  };
  const characters = state.characters.map((entry) =>
    entry.id === characterId ? updatedCharacter : entry,
  );
  const soldier =
    characterId === PLAYER_CHARACTER_ID
      ? {
          ...state.soldier,
          coins: state.soldier.coins - option.cost.coins,
          xp: state.soldier.xp - option.cost.xp,
          fatigue: updatedCharacter.fatigue,
          stats: { ...updatedCharacter.stats },
          equipment: { ...updatedCharacter.equipment },
        }
      : {
          ...state.soldier,
          coins: state.soldier.coins - option.cost.coins,
          xp: state.soldier.xp - option.cost.xp,
        };
  return {
    next: { ...state, soldier, characters },
    result: ok(`${updatedCharacter.name} completa: ${option.name}.`),
  };
}
