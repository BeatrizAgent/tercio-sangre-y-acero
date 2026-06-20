// Pure arena fight math: compute power, roll the die, decide success,
// apply rewards and wounds.

import { getArenaOpponent } from "../data/arena";
import { getNextRank } from "../data/ranks";
import { getEquipmentBonuses } from "./equipment";
import { fail, ok, type ActionResult } from "./result";
import type { ArenaResult, GameState } from "../types";

export function fightArenaOpponentInState(
  state: GameState,
  opponentId: string,
): { next: GameState; result: ActionResult<{ resultId?: string }> } {
  const opponent = getArenaOpponent(opponentId);
  if (!opponent) return { next: state, result: fail("Rival de arena desconocido.") };
  if (state.soldier.fatigue >= 100) {
    return { next: state, result: fail("Diego está demasiado agotado para batirse en la arena.") };
  }
  const equipmentBonuses = getEquipmentBonuses(state.soldier.equipment);
  const untreatedWounds = state.soldier.wounds.filter((wound) => !wound.treated).length;
  const arenaPower =
    state.soldier.stats.sword +
    state.soldier.stats.pike +
    state.soldier.stats.vigor +
    state.soldier.stats.discipline +
    state.soldier.stats.command +
    Number(equipmentBonuses.sword ?? 0) +
    Number(equipmentBonuses.pike ?? 0) +
    Number(equipmentBonuses.vigor ?? 0) +
    Number(equipmentBonuses.discipline ?? 0) -
    untreatedWounds * 2 -
    Math.floor(state.soldier.fatigue / 12);
  const roll = Math.floor(Math.random() * 6) + 1;
  const success = arenaPower + roll >= opponent.power;
  const rewards = {
    coins: success ? opponent.rewards.coins : Math.max(1, Math.floor(opponent.rewards.coins / 3)),
    xp: success ? opponent.rewards.xp : Math.max(1, Math.floor(opponent.rewards.xp / 2)),
    honor: success ? opponent.rewards.honor : 0,
  };
  const wounds =
    !success || opponent.woundChance + state.soldier.fatigue >= 45
      ? ["broken_rib"]
      : [];

  const soldier = {
    ...state.soldier,
    coins: state.soldier.coins + rewards.coins,
    xp: state.soldier.xp + rewards.xp,
    honor: state.soldier.honor + rewards.honor,
    fatigue: Math.min(100, state.soldier.fatigue + opponent.fatigue),
    wounds: [
      ...state.soldier.wounds,
      ...wounds.map((woundId) => ({ id: `${woundId}_${Date.now()}`, woundId, treated: false })),
    ],
  };
  const nextRank = getNextRank(soldier.xp, soldier.honor);
  if (nextRank) soldier.rank = nextRank.id;

  const arenaResult: ArenaResult = {
    id: `arena_${Date.now()}`,
    opponentId: opponent.id,
    success,
    report: success
      ? `Diego aguanta el primer choque contra ${opponent.name}, encuentra hueco entre polvo y gritos, y gana el duelo.`
      : `${opponent.name} castiga la guardia de Diego. Hay paga pequeña por presentarse, pero ningún honor.`,
    rewards,
    fatigue: opponent.fatigue,
    wounds,
    createdAt: new Date().toISOString(),
  };

  return {
    next: {
      ...state,
      soldier,
      arenaResults: [arenaResult, ...(state.arenaResults ?? [])],
    },
    result: ok(success ? "Victoria en la arena." : "Derrota en la arena.", { resultId: arenaResult.id }),
  };
}
