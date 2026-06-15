"use client";

import type { Container, Graphics } from "pixi.js";

export type PixiRuntime = typeof import("pixi.js");

export function drawWeaponSprite(
  pixi: PixiRuntime,
  weapon: "pike" | "arquebus",
  facing: 1 | -1,
): Graphics {
  const graphic = new pixi.Graphics();
  if (weapon === "arquebus") {
    graphic.moveTo(-66 * facing, 10).lineTo(86 * facing, -18).stroke({ width: 10, color: 0x5a351f });
    graphic.moveTo(-24 * facing, 2).lineTo(104 * facing, -22).stroke({ width: 3, color: 0xaab0ae });
    return graphic;
  }

  graphic.moveTo(-72 * facing, 38).lineTo(104 * facing, -92).stroke({ width: 5, color: 0x6b4b2e });
  graphic.poly([104 * facing, -92, 124 * facing, -86, 109 * facing, -74]).fill(0xc9d0d1);
  return graphic;
}

export function addRimLight(pixi: PixiRuntime, group: Container, facing: 1 | -1) {
  const rim = new pixi.Graphics();
  rim.moveTo(34 * facing, -62).lineTo(28 * facing, 52).stroke({ width: 2, color: 0xd8c28b, alpha: 0.42 });
  group.addChild(rim);
}
