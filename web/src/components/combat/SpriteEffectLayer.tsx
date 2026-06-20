"use client";

import type { Container, Graphics, Text } from "pixi.js";
import { rainParticlePreset, smokeParticlePreset, sparkParticlePreset } from "@/lib/domain/combat/particle-presets";
import type { PixiRuntime } from "./CombatSprite";

export interface RuntimeParticle {
  node: Graphics | Container;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  fade: boolean;
}

export function SpriteEffectLayer(pixi: PixiRuntime) {
  return {
    createRainLayer(width: number, height: number) {
      const layer = new pixi.Container();
      const drops: Array<{ node: Graphics; speed: number; drift: number }> = [];
      for (let i = 0; i < rainParticlePreset.count; i++) {
        const drop = new pixi.Graphics();
        drop.moveTo(0, 0).lineTo(-8, 34).stroke({
          width: 1.4,
          color: 0x9ca8b4,
          alpha: rainParticlePreset.minAlpha + Math.random() * (rainParticlePreset.maxAlpha - rainParticlePreset.minAlpha),
        });
        drop.x = Math.random() * width;
        drop.y = Math.random() * height;
        layer.addChild(drop);
        drops.push({
          node: drop,
          speed: rainParticlePreset.minSpeed + Math.random() * (rainParticlePreset.maxSpeed - rainParticlePreset.minSpeed),
          drift: rainParticlePreset.driftMin + Math.random() * (rainParticlePreset.driftMax - rainParticlePreset.driftMin),
        });
      }
      return { layer, drops };
    },

    createSmokeBurst(layer: Container, particles: RuntimeParticle[], x: number, y: number) {
      for (let i = 0; i < smokeParticlePreset.count; i++) {
        const puff = new pixi.Graphics();
        const radius = smokeParticlePreset.minRadius + Math.random() * (smokeParticlePreset.maxRadius - smokeParticlePreset.minRadius);
        puff.circle(0, 0, radius).fill({ color: 0xc8c1ad, alpha: 0.14 + Math.random() * 0.18 });
        puff.x = x + (Math.random() - 0.5) * 28;
        puff.y = y + (Math.random() - 0.5) * 22;
        layer.addChild(puff);
        particles.push({
          node: puff,
          vx: 0.4 + Math.random() * smokeParticlePreset.driftX,
          vy: -0.4 - Math.random() * Math.abs(smokeParticlePreset.driftY),
          life: 0,
          maxLife: 72 + Math.random() * smokeParticlePreset.maxLife,
          fade: true,
        });
      }
    },

    createArquebusShot(layer: Container, particles: RuntimeParticle[], x: number, y: number) {
      const flash = new pixi.Graphics();
      flash.poly([x, y, x + 96, y - 28, x + 56, y + 30]).fill({ color: 0xffd36a, alpha: 0.88 });
      flash.circle(x + 24, y, 32).fill({ color: 0xffffff, alpha: 0.55 });
      layer.addChild(flash);
      particles.push({ node: flash, vx: 0, vy: 0, life: 0, maxLife: 12, fade: true });
      this.createSmokeBurst(layer, particles, x + 58, y);
    },

    createSparkBurst(layer: Container, particles: RuntimeParticle[], x: number, y: number) {
      for (let i = 0; i < sparkParticlePreset.count; i++) {
        const spark = new pixi.Graphics();
        spark.circle(0, 0, sparkParticlePreset.minRadius + Math.random() * sparkParticlePreset.maxRadius).fill({
          color: Math.random() > 0.5 ? 0xffffff : 0xffc84a,
          alpha: 0.9,
        });
        spark.x = x + (Math.random() - 0.5) * 45;
        spark.y = y + (Math.random() - 0.5) * 44;
        layer.addChild(spark);
        particles.push({
          node: spark,
          vx: (Math.random() - 0.5) * 6,
          vy: -2 - Math.random() * 4,
          life: 0,
          maxLife: 28 + Math.random() * sparkParticlePreset.maxLife,
          fade: true,
        });
      }
    },

    createFloatingText(layer: Container, text: string, x: number, y: number, color: number) {
      const label = new pixi.Text({
        text,
        style: {
          fill: color,
          fontFamily: "Georgia, serif",
          fontSize: 22,
          fontWeight: "700",
          stroke: { color: 0x0b0907, width: 4 },
        },
      });
      label.anchor.set(0.5);
      label.x = x;
      label.y = y;
      layer.addChild(label);
      return { node: label as Text, born: performance.now(), vy: -0.35 };
    },
  };
}
