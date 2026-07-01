// Pure training math. Spends coins + xp, gains stat, adds fatigue. Returns
// the next state and an ActionResult. Character training is also exposed
// for the company view.

import { BOOST_GAIN, boostCostFor, trainingOptions } from "../data/training";
import { PLAYER_CHARACTER_ID } from "./player-character";
import { fail, ok, type ActionResult } from "./result";
import type { GameState, StatId } from "../types";

export function trainSoldierStatInState(
  state: GameState,
  stat: StatId,
): { next: GameState; result: ActionResult } {
  const option = trainingOptions.find((entry) => entry.stat === stat);
  if (!option) return { next: state, result: fail("Entrenamiento no encontrado.") };
  if (state.soldier.coins < option.cost.coins || state.soldier.xp < option.cost.xp) {
    return { next: state, result: fail("Monedas o experiencia insuficientes.") };
  }
  if (state.soldier.fatigue + option.fatigue > 100) {
    return { next: state, result: fail("La fatiga no admite más instrucción.") };
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
  if (character.fatigue + option.fatigue > 100) {
    return { next: state, result: fail(`${character.name} está demasiado agotado para entrenar.`) };
  }
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

export function trainSoldierStatBoostInState(
  state: GameState,
  stat: StatId,
): { next: GameState; result: ActionResult } {
  const option = trainingOptions.find((entry) => entry.stat === stat);
  if (!option) return { next: state, result: fail("Entrenamiento no encontrado.") };
  const cost = boostCostFor(option);
  if (state.soldier.coins < cost.coins) {
    return { next: state, result: fail("Monedas insuficientes para la mejora.") };
  }
  if (state.soldier.fatigue + cost.fatigue > 100) {
    return { next: state, result: fail("La fatiga no admite una mejora tan dura.") };
  }
  const soldier = {
    ...state.soldier,
    coins: state.soldier.coins - cost.coins,
    fatigue: Math.min(100, state.soldier.fatigue + cost.fatigue),
    stats: { ...state.soldier.stats, [stat]: state.soldier.stats[stat] + BOOST_GAIN },
  };
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
    result: ok(`Mejora aplicada: +${BOOST_GAIN} en ${option.name}.`),
  };
}

export function trainCharacterStatBoostInState(
  state: GameState,
  characterId: string,
  stat: StatId,
): { next: GameState; result: ActionResult } {
  const option = trainingOptions.find((entry) => entry.stat === stat);
  if (!option) return { next: state, result: fail("Entrenamiento no encontrado.") };
  const cost = boostCostFor(option);
  if (state.soldier.coins < cost.coins) {
    return { next: state, result: fail("Monedas insuficientes para la mejora.") };
  }
  const character = state.characters.find((entry) => entry.id === characterId);
  if (!character) return { next: state, result: fail("Personaje no encontrado.") };
  if (character.fatigue + cost.fatigue > 100) {
    return { next: state, result: fail(`${character.name} no aguanta la mejora sin reventar.`) };
  }
  const updatedCharacter = {
    ...character,
    fatigue: Math.min(100, character.fatigue + cost.fatigue),
    stats: { ...character.stats, [stat]: character.stats[stat] + BOOST_GAIN },
  };
  const characters = state.characters.map((entry) =>
    entry.id === characterId ? updatedCharacter : entry,
  );
  const soldier =
    characterId === PLAYER_CHARACTER_ID
      ? {
          ...state.soldier,
          coins: state.soldier.coins - cost.coins,
          fatigue: updatedCharacter.fatigue,
          stats: { ...updatedCharacter.stats },
          equipment: { ...updatedCharacter.equipment },
        }
      : {
          ...state.soldier,
          coins: state.soldier.coins - cost.coins,
        };
  return {
    next: { ...state, soldier, characters },
    result: ok(`${updatedCharacter.name} mejora: +${BOOST_GAIN} en ${option.name}.`),
  };
}
