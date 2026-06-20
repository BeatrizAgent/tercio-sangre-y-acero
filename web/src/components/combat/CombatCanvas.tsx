"use client";

import { useEffect, useRef } from "react";
import type { Application, Container, Graphics, Text } from "pixi.js";
import type { CombatResult } from "@/lib/combat/combat-types";
import { COMBAT_CANVAS_HEIGHT, COMBAT_CANVAS_WIDTH, outcomeDelayMs } from "@/lib/combat/combat-animation-script";

interface CombatCanvasProps {
  missionTitle: string;
  result: CombatResult;
  onSequenceComplete?: () => void;
}

interface Particle {
  node: Graphics | Container;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  fade: boolean;
}

export function CombatCanvas({ missionTitle, result, onSequenceComplete }: CombatCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hostElement = hostRef.current;
    let cancelled = false;
    let app: Application | null = null;
    let appCanvas: HTMLCanvasElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let completionTimer: number | null = null;

    async function mountPixi() {
      const host = hostElement;
      if (!host) return;

      const pixi = await import("pixi.js");
      if (cancelled) return;

      app = new pixi.Application();
      await app.init({
        width: COMBAT_CANVAS_WIDTH,
        height: COMBAT_CANVAS_HEIGHT,
        backgroundAlpha: 0,
        antialias: true,
        autoStart: true,
        sharedTicker: false,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (cancelled) {
        app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
        return;
      }

      app.canvas.style.display = "block";
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      appCanvas = app.canvas;
      host.replaceChildren(app.canvas);

      const world = new pixi.Container();
      const backgroundLayer = new pixi.Container();
      const farLayer = new pixi.Container();
      const groundLayer = new pixi.Container();
      const propsLayer = new pixi.Container();
      const unitLayer = new pixi.Container();
      const rainLayer = new pixi.Container();
      const smokeLayer = new pixi.Container();
      const hudLayer = new pixi.Container();
      const floatingLayer = new pixi.Container();
      world.addChild(backgroundLayer, farLayer, groundLayer, propsLayer, unitLayer, rainLayer, smokeLayer, hudLayer, floatingLayer);
      app.stage.addChild(world);

      const particles: Particle[] = [];
      const floatingTexts: Array<{ node: Text; born: number; vy: number }> = [];
      const start = performance.now();
      let shotTriggered = false;
      let responseTriggered = false;
      let outcomeShown = false;
      let modifierIndex = 0;

      const makeRect = (x: number, y: number, width: number, height: number, color: number, alpha = 1) => {
        const graphic = new pixi.Graphics();
        graphic.rect(x, y, width, height).fill({ color, alpha });
        return graphic;
      };

      const createRainLayer = () => {
        const drops: Array<{ node: Graphics; speed: number; drift: number }> = [];
        for (let i = 0; i < 120; i++) {
          const drop = new pixi.Graphics();
          drop.moveTo(0, 0).lineTo(-8, 34).stroke({ width: 1.4, color: 0x9ca8b4, alpha: 0.18 + Math.random() * 0.28 });
          drop.x = Math.random() * COMBAT_CANVAS_WIDTH;
          drop.y = Math.random() * COMBAT_CANVAS_HEIGHT;
          rainLayer.addChild(drop);
          drops.push({ node: drop, speed: 9 + Math.random() * 9, drift: -1.2 - Math.random() * 2 });
        }
        return drops;
      };

      const createSmokeBurst = (x: number, y: number) => {
        for (let i = 0; i < 24; i++) {
          const puff = new pixi.Graphics();
          const radius = 10 + Math.random() * 22;
          puff.circle(0, 0, radius).fill({ color: 0xc8c1ad, alpha: 0.16 + Math.random() * 0.18 });
          puff.x = x + (Math.random() - 0.5) * 26;
          puff.y = y + (Math.random() - 0.5) * 20;
          smokeLayer.addChild(puff);
          particles.push({
            node: puff,
            vx: 0.5 + Math.random() * 1.8,
            vy: -0.7 - Math.random() * 1.4,
            life: 0,
            maxLife: 80 + Math.random() * 45,
            fade: true,
          });
        }
      };

      const createFloatingText = (text: string, x: number, y: number, color: number) => {
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
        floatingLayer.addChild(label);
        floatingTexts.push({ node: label, born: performance.now(), vy: -0.35 });
      };

      const createArquebusShot = (x: number, y: number) => {
        const flash = new pixi.Graphics();
        flash.poly([x, y, x + 96, y - 28, x + 56, y + 30]).fill({ color: 0xffd36a, alpha: 0.86 });
        flash.circle(x + 24, y, 32).fill({ color: 0xffffff, alpha: 0.5 });
        smokeLayer.addChild(flash);
        particles.push({ node: flash, vx: 0, vy: 0, life: 0, maxLife: 12, fade: true });
        createSmokeBurst(x + 58, y);
      };

      const shakeCamera = (intensity = 16) => {
        world.x = (Math.random() - 0.5) * intensity;
        world.y = (Math.random() - 0.5) * intensity;
      };

      const showOutcomeBadge = () => {
        const badge = new pixi.Container();
        const plate = new pixi.Graphics();
        plate.roundRect(-150, -48, 300, 96, 8).fill({ color: result.success ? 0x6f5529 : 0x651b1b, alpha: 0.94 });
        plate.stroke({ width: 2, color: 0xe0c284, alpha: 0.9 });
        const label = new pixi.Text({
          text: result.success ? "ÉXITO" : "FALLO",
          style: {
            fill: 0xfff2d0,
            fontFamily: "Georgia, serif",
            fontSize: 46,
            fontWeight: "900",
            letterSpacing: 4,
          },
        });
        label.anchor.set(0.5);
        badge.addChild(plate, label);
        badge.x = COMBAT_CANVAS_WIDTH / 2;
        badge.y = COMBAT_CANVAS_HEIGHT / 2 - 22;
        badge.alpha = 0;
        hudLayer.addChild(badge);
        particles.push({ node: badge, vx: 0, vy: 0, life: 0, maxLife: 24, fade: false });
      };

      backgroundLayer.addChild(makeRect(0, 0, COMBAT_CANVAS_WIDTH, COMBAT_CANVAS_HEIGHT, 0x15110d));
      backgroundLayer.addChild(makeRect(0, 0, COMBAT_CANVAS_WIDTH, 360, 0x1f211f, 0.55));

      const fog = new pixi.Graphics();
      fog.ellipse(620, 286, 540, 130).fill({ color: 0xc8c0aa, alpha: 0.055 });
      fog.ellipse(380, 420, 500, 80).fill({ color: 0xb2ad9c, alpha: 0.045 });
      backgroundLayer.addChild(fog);

      const fort = new pixi.Graphics();
      fort.rect(0, 295, COMBAT_CANVAS_WIDTH, 120).fill({ color: 0x0b0c0c, alpha: 0.58 });
      for (let i = 0; i < 8; i++) {
        fort.rect(i * 180 + 20, 210 + (i % 2) * 28, 90, 100).fill({ color: 0x0c0d0d, alpha: 0.46 });
      }
      farLayer.addChild(fort);

      const ground = new pixi.Graphics();
      ground.rect(0, 500, COMBAT_CANVAS_WIDTH, 220).fill(0x211914);
      for (let i = 0; i < 20; i++) {
        ground.moveTo(i * 76, 558 + (i % 4) * 17).lineTo(i * 76 + 54, 558 + (i % 4) * 17).stroke({ width: 4, color: 0x17110e, alpha: 0.85 });
      }
      groundLayer.addChild(ground);

      const cart = new pixi.Graphics();
      cart.rect(430, 456, 176, 70).fill(0x5c3b22);
      cart.rect(456, 414, 124, 52).fill(0x6b4527);
      cart.circle(464, 538, 22).fill(0x090807);
      cart.circle(570, 538, 22).fill(0x090807);
      cart.rect(474, 392, 88, 22).fill({ color: 0x30241b, alpha: 0.95 });
      propsLayer.addChild(cart);

      // Deduce relevantStat from result modifiers
      const firstModifierLabel = result.modifiers[0]?.label || "";
      const relevantStat = firstModifierLabel === "Pica" ? "pike" :
                           firstModifierLabel === "Espada" ? "sword" :
                           firstModifierLabel === "Disciplina" ? "discipline" :
                           "arquebus";

      // Try to load textures
      let playerTexture = null;
      let enemyTexture = null;
      let allyTexture = null;
      let enemyFarTexture = null;
      let walkSheetTexture = null;
      let pikeAttackSheetTexture = null;
      let swordAttackSheetTexture = null;

      try {
        const playerPath = relevantStat === "arquebus" ? "/assets/combat/units/arquebusier_player.png" : "/assets/combat/units/pikeman_player.png";
        const enemyPath = result.target > 10 ? "/assets/combat/units/arquebusier_enemy.png" : "/assets/combat/units/pikeman_enemy.png";

        [playerTexture, enemyTexture, allyTexture, enemyFarTexture, walkSheetTexture, pikeAttackSheetTexture, swordAttackSheetTexture] = await Promise.all([
          pixi.Assets.load(playerPath).catch(() => null),
          pixi.Assets.load(enemyPath).catch(() => null),
          pixi.Assets.load("/assets/combat/units/pikeman_player.png").catch(() => null),
          pixi.Assets.load("/assets/combat/units/pikeman_enemy.png").catch(() => null),
          pixi.Assets.load("/assets/gpt-bank/characters/diego/sprites/diego_sprite_caminar.png").catch(() => null),
          pixi.Assets.load("/assets/gpt-bank/characters/diego/sprites/diego_sprite_ataque_pica.png").catch(() => null),
          pixi.Assets.load("/assets/gpt-bank/characters/diego/sprites/diego_sprite_golpe_espada.png").catch(() => null),
        ]);
      } catch (err) {
        console.warn("Error loading textures:", err);
      }

      // Slice sheet helper function
      const sliceSheet = (sheetTexture: any, frameWidth: number, frameHeight: number) => {
        if (!sheetTexture) return [];
        const frames = [];
        for (let i = 0; i < 3; i++) {
          const rect = new pixi.Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
          const tex = new pixi.Texture({
            source: sheetTexture.source,
            frame: rect,
          });
          frames.push(tex);
        }
        return frames;
      };

      const walkScale = 0.26;
      const targetHeight = 714 * walkScale; // 185.64 pixels
      const pikeScale = targetHeight / 570;
      const swordScale = targetHeight / 642;

      const walkFrames = walkSheetTexture ? sliceSheet(walkSheetTexture, 2031 / 3, 714) : [];
      const pikeFrames = pikeAttackSheetTexture ? sliceSheet(pikeAttackSheetTexture, 2076 / 3, 570) : [];
      const swordFrames = swordAttackSheetTexture ? sliceSheet(swordAttackSheetTexture, 2141 / 3, 642) : [];

      const canAnimate = walkFrames.length > 0 &&
                         (relevantStat === "pike" || relevantStat === "discipline" || relevantStat === "sword");

      let player: any;
      let isAnimatedPlayer = false;

      if (canAnimate) {
        player = new pixi.Sprite(walkFrames[0]);
        player.anchor.set(0.5, 0.94);
        player.scale.set(walkScale);
        player.y = 575;
        isAnimatedPlayer = true;
      } else if (playerTexture) {
        player = new pixi.Sprite(playerTexture);
        (player as any).anchor.set(0.5, 0.94);
        player.scale.set(0.26);
        player.y = 575;
      } else {
        player = new pixi.Container();
        player.y = 450;
      }
      player.x = 270;
      player.alpha = 0;

      let enemy: any;
      if (enemyTexture) {
        enemy = new pixi.Sprite(enemyTexture);
        (enemy as any).anchor.set(0.5, 0.94);
        enemy.scale.set(-0.25, 0.25);
        enemy.y = 575;
      } else {
        enemy = new pixi.Container();
        enemy.y = 450;
      }
      enemy.x = 965;
      enemy.alpha = 0;

      let ally: any;
      if (allyTexture) {
        ally = new pixi.Sprite(allyTexture);
        (ally as any).anchor.set(0.5, 0.94);
        ally.scale.set(0.14);
        ally.y = 540;
      } else {
        ally = new pixi.Container();
        ally.y = 510;
      }
      ally.x = 110;
      ally.alpha = 0.38;

      let enemyFar: any;
      if (enemyFarTexture) {
        enemyFar = new pixi.Sprite(enemyFarTexture);
        (enemyFar as any).anchor.set(0.5, 0.94);
        enemyFar.scale.set(-0.13, 0.13);
        enemyFar.y = 540;
      } else {
        enemyFar = new pixi.Container();
        enemyFar.y = 510;
      }
      enemyFar.x = 1160;
      enemyFar.alpha = 0.32;

      unitLayer.addChild(ally, enemyFar, player, enemy);

      const title = new pixi.Text({
        text: missionTitle,
        style: {
          fill: 0xd7bd75,
          fontFamily: "Georgia, serif",
          fontSize: 30,
          fontWeight: "700",
          stroke: { color: 0x060504, width: 5 },
        },
      });
      title.anchor.set(0.5);
      title.x = COMBAT_CANVAS_WIDTH / 2;
      title.y = 92;
      title.alpha = 0;
      hudLayer.addChild(title);

      // White overlay for combat flashes (arquebus shot, weapon impact)
      const flashOverlay = new pixi.Graphics();
      flashOverlay.rect(0, 0, COMBAT_CANVAS_WIDTH, COMBAT_CANVAS_HEIGHT).fill({ color: 0xffffff, alpha: 0 });
      hudLayer.addChild(flashOverlay);

      const rainDrops = createRainLayer();

      resizeObserver = new ResizeObserver(([entry]) => {
        const width = entry.contentRect.width;
        const height = width * (COMBAT_CANVAS_HEIGHT / COMBAT_CANVAS_WIDTH);
        host.style.height = `${height}px`;
        app?.renderer.resize(COMBAT_CANVAS_WIDTH, COMBAT_CANVAS_HEIGHT);
      });
      resizeObserver.observe(host);

      completionTimer = window.setTimeout(() => onSequenceComplete?.(), outcomeDelayMs);

      app.ticker.add(() => {
        const now = performance.now();
        const elapsed = now - start;

        rainDrops.forEach((drop) => {
          drop.node.x += drop.drift;
          drop.node.y += drop.speed;
          if (drop.node.y > COMBAT_CANVAS_HEIGHT + 40) {
            drop.node.y = -40;
            drop.node.x = Math.random() * COMBAT_CANVAS_WIDTH;
          }
        });

        world.x *= 0.78;
        world.y *= 0.78;

        // Screen Flash fade logic
        if (flashOverlay.alpha > 0.01) {
          flashOverlay.alpha *= 0.82;
        } else {
          flashOverlay.alpha = 0;
        }

        title.alpha = Math.min(1, Math.max(0, (elapsed - 350) / 600));
        player.alpha = Math.min(1, Math.max(0, (elapsed - 800) / 500));
        enemy.alpha = Math.min(1, Math.max(0, (elapsed - 1050) / 600));
        player.x = 270 + Math.sin(elapsed * 0.007) * 5;
        enemy.x = 965 - Math.min(50, Math.max(0, (elapsed - 3000) / 20));

        // Animate spritesheet texture frames based on current time elapsed
        if (isAnimatedPlayer) {
          if (elapsed < 900) {
            player.texture = walkFrames[0];
            player.scale.set(walkScale);
          } else if (elapsed >= 900 && elapsed < 2200) {
            // walking loop during deployment
            const walkSpeed = 120;
            const frameIndex = Math.floor((elapsed - 900) / walkSpeed) % 3;
            player.texture = walkFrames[frameIndex];
            player.scale.set(walkScale);
          } else if (elapsed >= 2200 && elapsed < 2550) {
            // standing guard/idle pose
            player.texture = walkFrames[1];
            player.scale.set(walkScale);
          } else if (elapsed >= 2550 && elapsed < 3350) {
            // attack lunges and hits
            if ((relevantStat === "pike" || relevantStat === "discipline") && pikeFrames.length > 0) {
              const attackElapsed = elapsed - 2550;
              let frameIdx = 0;
              if (attackElapsed > 550) frameIdx = 2; // recovery
              else if (attackElapsed > 150) frameIdx = 1; // thrust forward
              player.texture = pikeFrames[frameIdx];
              player.scale.set(pikeScale);
            } else if (relevantStat === "sword" && swordFrames.length > 0) {
              const attackElapsed = elapsed - 2550;
              let frameIdx = 0;
              if (attackElapsed > 550) frameIdx = 2; // recovery
              else if (attackElapsed > 150) frameIdx = 1; // slash hit
              player.texture = swordFrames[frameIdx];
              player.scale.set(swordScale);
            } else {
              player.texture = walkFrames[1];
              player.scale.set(walkScale);
            }
          } else {
            // post-attack guard pose
            player.texture = walkFrames[1];
            player.scale.set(walkScale);
          }
        }

        if (elapsed > 1450 && elapsed < 1900 && floatingTexts.length < result.modifiers.length) {
          const modifier = result.modifiers[floatingTexts.length];
          createFloatingText(`${modifier.value >= 0 ? "+" : ""}${modifier.label}: ${modifier.value}`, 330, 250 + floatingTexts.length * 34, modifier.value >= 0 ? 0xd9bf78 : 0xd05048);
        }

        if (!shotTriggered && elapsed > 2500) {
          shotTriggered = true;
          if (relevantStat === "arquebus") {
            createArquebusShot(388, 337);
            player.rotation = -0.035;
            flashOverlay.alpha = 0.45;
          } else {
            player.x += 100;
            player.rotation = 0.04;
            flashOverlay.alpha = 0.35;
          }
          createFloatingText(`Tirada determinista: +${result.roll}`, COMBAT_CANVAS_WIDTH / 2, 162, 0xffdc68);
          shakeCamera(20);
        }

        if (!responseTriggered && elapsed > 3350) {
          responseTriggered = true;
          player.rotation = 0;
          for (let i = 0; i < 34; i++) {
            const spark = new pixi.Graphics();
            spark.circle(0, 0, 3 + Math.random() * 4).fill({ color: Math.random() > 0.5 ? 0xffffff : 0xffc84a, alpha: 0.9 });
            spark.x = 650 + (Math.random() - 0.5) * 45;
            spark.y = 330 + (Math.random() - 0.5) * 44;
            smokeLayer.addChild(spark);
            particles.push({
              node: spark,
              vx: (Math.random() - 0.5) * 6,
              vy: -2 - Math.random() * 4,
              life: 0,
              maxLife: 38 + Math.random() * 24,
              fade: true,
            });
          }
          createFloatingText("¡Choque de armas!", COMBAT_CANVAS_WIDTH / 2, 238, 0xf2e0b8);
          shakeCamera(26);
          flashOverlay.alpha = 0.55;
        }

        if (!outcomeShown && elapsed > 4700) {
          outcomeShown = true;
          showOutcomeBadge();
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const particle = particles[i];
          particle.life += 1;
          particle.node.x += particle.vx;
          particle.node.y += particle.vy;
          if (particle.fade) {
            particle.node.alpha = Math.max(0, 1 - particle.life / particle.maxLife);
          } else {
            particle.node.alpha = Math.min(1, particle.life / particle.maxLife);
          }
          if (particle.life > particle.maxLife) {
            if (particle.fade) {
              particle.node.destroy();
              particles.splice(i, 1);
            } else {
              particle.node.alpha = 1;
            }
          }
        }

        for (let i = floatingTexts.length - 1; i >= 0; i--) {
          const floating = floatingTexts[i];
          const age = now - floating.born;
          floating.node.y += floating.vy;
          floating.node.alpha = age > 1800 ? Math.max(0, 1 - (age - 1800) / 700) : 1;
          if (age > 2600) {
            floating.node.destroy();
            floatingTexts.splice(i, 1);
          }
        }
      });
    }

    mountPixi();

    return () => {
      cancelled = true;
      if (completionTimer !== null) window.clearTimeout(completionTimer);
      resizeObserver?.disconnect();
      if (app) {
        app.ticker?.stop();
        try {
          app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
        } catch {
          appCanvas?.remove();
        }
      }
      hostElement?.replaceChildren();
    };
  }, [missionTitle, onSequenceComplete, result]);

  return (
    <div className="relative w-full bg-stone-950">
      <div ref={hostRef} className="aspect-video w-full overflow-hidden bg-stone-950" />
    </div>
  );
}
