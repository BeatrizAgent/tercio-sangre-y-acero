import { combatAnimationPreset } from "@/lib/domain/combat/animation-presets";
import type { CombatResult } from "@/lib/domain/combat/combat-types";
import { getRelevantCombatStat } from "@/lib/domain/combat/combat-resolver";
import { missionTeamSpriteByStat } from "@/lib/game-data";
import type { StatId } from "@/lib/types";

export type CombatActorState = "idle" | "walk" | "attack" | "hurt";
export type CombatActionKind = "shot" | "melee";
export type CombatSide = "player" | "enemy";

export interface CombatActorCue {
  from: number;
  to: number;
  state: CombatActorState;
}

export interface CombatSceneActor {
  key: string;
  spriteId: string;
  side: CombatSide;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  facing: 1 | -1;
  lane: "front" | "middle" | "back";
  cues: CombatActorCue[];
}

export interface CombatScenePlan {
  relevantStat: StatId;
  actionKind: CombatActionKind;
  enemyWeapon: "arquebus" | "pike" | "sword";
  player: CombatSceneActor;
  enemy: CombatSceneActor;
  support: CombatSceneActor[];
  impact: {
    x: number;
    y: number;
    flashAlpha: number;
    lunge: number;
  };
  loadedSpriteIds: string[];
}

interface BuildCombatScenePlanInput {
  missionType?: string;
  result: CombatResult;
}

export function buildCombatScenePlan({ missionType, result }: BuildCombatScenePlanInput): CombatScenePlan {
  const relevantStat = getRelevantCombatStat(missionType ?? "");
  const actionKind: CombatActionKind = relevantStat === "arquebus" ? "shot" : "melee";
  const playerSpriteId = missionTeamSpriteByStat[relevantStat] ?? "team_pikeman";
  const enemyWeapon = pickEnemyWeapon(missionType, result);
  const enemySpriteId = enemyWeapon === "arquebus" ? "minion_arquebus" : enemyWeapon === "sword" ? "minion_sword" : "minion_pike";
  const support = buildSupportActors(playerSpriteId, enemySpriteId, result.target);

  const player: CombatSceneActor = {
    key: "player-front",
    spriteId: playerSpriteId,
    side: "player",
    x: combatAnimationPreset.playerReadyX,
    y: 592,
    scale: 0.58,
    alpha: 1,
    facing: 1,
    lane: "front",
    cues: [
      { from: combatAnimationPreset.deployMs, to: combatAnimationPreset.shotMs - 360, state: "walk" },
      { from: combatAnimationPreset.shotMs - 80, to: combatAnimationPreset.responseMs - 120, state: "attack" },
    ],
  };

  const enemy: CombatSceneActor = {
    key: "enemy-front",
    spriteId: enemySpriteId,
    side: "enemy",
    x: combatAnimationPreset.enemyReadyX,
    y: 596,
    scale: 0.6,
    alpha: 1,
    facing: 1,
    lane: "front",
    cues: [
      { from: combatAnimationPreset.deployMs + 180, to: combatAnimationPreset.shotMs - 280, state: "walk" },
      { from: combatAnimationPreset.responseMs - 260, to: combatAnimationPreset.responseMs + 120, state: "attack" },
      { from: combatAnimationPreset.responseMs + 121, to: combatAnimationPreset.responseMs + 760, state: "hurt" },
    ],
  };

  return {
    relevantStat,
    actionKind,
    enemyWeapon,
    player,
    enemy,
    support,
    impact: {
      x: actionKind === "shot" ? 388 : 650,
      y: actionKind === "shot" ? 337 : 330,
      flashAlpha: actionKind === "shot" ? 0.45 : 0.35,
      lunge: actionKind === "shot" ? 0 : 100,
    },
    loadedSpriteIds: unique([player.spriteId, enemy.spriteId, ...support.map((actor) => actor.spriteId)]),
  };
}

export function getActorStateAt(actor: CombatSceneActor, elapsed: number): CombatActorState {
  const cue = actor.cues.find((entry) => elapsed >= entry.from && elapsed < entry.to);
  if (cue) return cue.state;
  return "idle";
}

function pickEnemyWeapon(missionType: string | undefined, result: CombatResult): CombatScenePlan["enemyWeapon"] {
  const type = missionType ?? "";
  if (type.includes("skirmish") || type.includes("escort")) return "arquebus";
  if (type.includes("duel")) return "sword";
  if (result.enemy.id.includes("arquebus")) return "arquebus";
  return "pike";
}

function buildSupportActors(playerSpriteId: string, enemySpriteId: string, target: number): CombatSceneActor[] {
  const teamBackline = [
    createSupportActor("team-pike-left", "team_pikeman", "player", 155, 580, 0.46, 0.94, 0),
    createSupportActor("team-shot-left", "team_arquebusier", "player", 250, 552, 0.43, 0.92, 90),
    createSupportActor("team-assistant-left", "team_assistant", "player", 395, 600, 0.42, 0.9, 180),
    createSupportActor("team-sword-left", "team_rodelero", "player", 470, 572, 0.44, 0.92, 270),
    createSupportActor("team-gastador-left", "team_gastador", "player", 82, 620, 0.44, 0.9, 360),
  ].filter((actor) => actor.spriteId !== playerSpriteId);

  const enemyBackline = [
    createSupportActor("enemy-sword-right", "minion_sword", "enemy", 790, 604, 0.44, 0.94, 120),
    createSupportActor("enemy-shot-right", "minion_arquebus", "enemy", 1020, 574, 0.43, 0.92, 240),
    createSupportActor("enemy-pike-right", "minion_pike", "enemy", 1150, 628, 0.46, 0.92, 360),
  ].filter((actor) => actor.spriteId !== enemySpriteId);

  if (target >= 14) {
    enemyBackline.push(createSupportActor("enemy-boss-right", "enemy_boss_backline", "enemy", 1180, 574, 0.46, 0.94, 420));
  }

  return [...teamBackline, ...enemyBackline];
}

function createSupportActor(
  key: string,
  spriteId: string,
  side: CombatSide,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  offset: number,
): CombatSceneActor {
  return {
    key,
    spriteId,
    side,
    x,
    y,
    scale,
    alpha,
    facing: 1,
    lane: "back",
    cues: [{ from: combatAnimationPreset.deployMs + offset, to: combatAnimationPreset.outcomeMs, state: offset % 240 === 0 ? "walk" : "idle" }],
  };
}

function unique(values: string[]) {
  return [...new Set(values)];
}
