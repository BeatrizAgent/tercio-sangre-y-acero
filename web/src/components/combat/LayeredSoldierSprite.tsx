"use client";

import type { Container } from "pixi.js";
import { combatSpriteManifest } from "@/lib/domain/combat/sprite-manifest";
import type { CombatSpriteKind, CombatWeaponKind } from "@/lib/domain/combat/sprite-types";
import { addRimLight, drawWeaponSprite, type PixiRuntime } from "./CombatSprite";

export interface LayeredSoldierOptions {
  kind: CombatSpriteKind;
  weapon: CombatWeaponKind;
  facing: 1 | -1;
  scale?: number;
}

export function LayeredSoldierSprite(pixi: PixiRuntime, options: LayeredSoldierOptions): Container {
  const definition = combatSpriteManifest[options.kind];
  const palette = definition.fallback;
  const group = new pixi.Container();
  const facing = options.facing;
  group.scale.set((options.scale ?? 1) * facing, options.scale ?? 1);

  // fallback layered soldier: shadow, legs, body, backArm, weapon, frontArm, head, helmet, cloak.
  const shadow = new pixi.Graphics();
  shadow.ellipse(0, 118, 62, 14).fill({ color: 0x000000, alpha: 0.38 });
  group.addChild(shadow);

  const cloak = new pixi.Graphics();
  cloak.moveTo(-36, -54).quadraticCurveTo(0, -82, 42, -50).lineTo(34, 62).quadraticCurveTo(-4, 82, -38, 54).closePath();
  cloak.fill({ color: palette.coatDark, alpha: 0.88 });
  group.addChild(cloak);

  const legs = new pixi.Graphics();
  legs.moveTo(-16, 40).lineTo(-22, 116).moveTo(18, 40).lineTo(26, 116).stroke({ width: 14, color: 0x25201b });
  legs.moveTo(-14, 42).lineTo(-18, 92).moveTo(14, 42).lineTo(18, 92).stroke({ width: 9, color: palette.hose });
  group.addChild(legs);

  const body = new pixi.Graphics();
  body.moveTo(-42, -60).quadraticCurveTo(0, -94, 42, -60).lineTo(30, 50).quadraticCurveTo(0, 72, -30, 50).closePath();
  body.fill(palette.coat).stroke({ width: 2, color: palette.rim, alpha: 0.36 });
  group.addChild(body);

  const backArm = new pixi.Graphics();
  backArm.moveTo(-36, -44).lineTo(-66, 10).stroke({ width: 13, color: palette.coatDark });
  group.addChild(backArm);

  const weapon = drawWeaponSprite(pixi, options.weapon, 1);
  group.addChild(weapon);

  const frontArm = new pixi.Graphics();
  frontArm.moveTo(36, -44).lineTo(66, 10).stroke({ width: 13, color: palette.coatDark });
  group.addChild(frontArm);

  const straps = new pixi.Graphics();
  straps.moveTo(-34, -50).lineTo(28, 42).moveTo(34, -50).lineTo(-28, 42).stroke({ width: 7, color: palette.leather });
  group.addChild(straps);

  const head = new pixi.Graphics();
  head.ellipse(0, -104, 24, 28).fill(palette.skin).stroke({ width: 2, color: 0x3b2418 });
  group.addChild(head);

  const helmet = new pixi.Graphics();
  helmet.ellipse(0, -134, 44, 11).fill(palette.metal);
  helmet.ellipse(0, -146, 22, 19).fill(0x737a7a);
  helmet.moveTo(0, -164).lineTo(0, -132).stroke({ width: 2, color: 0xcfd6d4, alpha: 0.85 });
  group.addChild(helmet);

  addRimLight(pixi, group, 1);
  return group;
}
