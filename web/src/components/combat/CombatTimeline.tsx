"use client";

import { combatAnimationPreset, combatShakePreset } from "@/lib/domain/combat/animation-presets";
import type { CombatResult } from "@/lib/domain/combat/combat-types";
import { playCombatSound } from "@/lib/domain/combat/combat-audio";

export type CombatTimelineState = {
  shotTriggered: boolean;
  responseTriggered: boolean;
  outcomeShown: boolean;
  modifierIndex: number;
  shake: number;
};

export function createCombatTimelineState(): CombatTimelineState {
  return {
    shotTriggered: false,
    responseTriggered: false,
    outcomeShown: false,
    modifierIndex: 0,
    shake: 0,
  };
}

export function CombatTimeline(elapsed: number, state: CombatTimelineState, result: CombatResult, relevantStat?: string) {
  const events = {
    showModifier: elapsed > combatAnimationPreset.modifiersMs && state.modifierIndex < result.modifiers.length,
    fireShot: elapsed > combatAnimationPreset.shotMs && !state.shotTriggered,
    enemyResponse: elapsed > combatAnimationPreset.responseMs && !state.responseTriggered,
    showOutcome: elapsed > combatAnimationPreset.outcomeMs && !state.outcomeShown,
  };

  if (events.fireShot) {
    state.shotTriggered = true;
    state.shake = combatShakePreset.shot;
    if (relevantStat === "arquebus") {
      void playCombatSound("arquebus-shot");
    } else {
      void playCombatSound("steel-clash");
    }
  }
  if (events.enemyResponse) {
    state.responseTriggered = true;
    state.shake = combatShakePreset.clash;
    void playCombatSound("steel-clash");
  }
  if (events.showOutcome) {
    state.outcomeShown = true;
    void playCombatSound("result-stamp");
  }

  return events;
}
