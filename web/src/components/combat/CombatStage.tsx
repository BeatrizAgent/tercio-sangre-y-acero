"use client";

import { useEffect, useRef } from "react";
import type { Application, Sprite, Text, Texture } from "pixi.js";
import type { CombatResult } from "@/lib/domain/combat/combat-types";
import { COMBAT_CANVAS_HEIGHT, COMBAT_CANVAS_WIDTH, outcomeDelayMs } from "@/lib/domain/combat/combat-animation-script";
import { combatAnimationPreset, combatShakePreset } from "@/lib/domain/combat/animation-presets";
import { LayeredSoldierSprite } from "./LayeredSoldierSprite";
import { SpriteEffectLayer, type RuntimeParticle } from "./SpriteEffectLayer";
import { CombatTimeline, createCombatTimelineState } from "./CombatTimeline";
import { buildCombatScenePlan, getActorStateAt, type CombatSceneActor } from "@/lib/domain/combat/combat-scene-plan";

import {
  getMission,
  getMissionCombatSpritePath,
  getMissionCombatSpriteSet,
  getMissionSceneImagePath,
} from "@/lib/game-data";
import type { MissionCombatSpriteSet, SpriteSheetRef } from "@/lib/types";

interface CombatStageProps {
  missionTitle: string;
  missionId?: string;
  result: CombatResult;
  onSequenceComplete?: () => void;
}

type MissionAnimation = {
  set: MissionCombatSpriteSet;
  idle: Texture[];
  walk: Texture[];
  attack: Texture[];
  hurt: Texture[];
};

type MissionSpriteRuntime = {
  sprite: Sprite;
  animation: MissionAnimation;
  baseScale: number;
  facing: 1 | -1;
};

export function CombatStage({ missionTitle, missionId, result, onSequenceComplete }: CombatStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hostElement = hostRef.current;
    let cancelled = false;
    let app: Application | null = null;
    let appCanvas: HTMLCanvasElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let completionTimer: number | null = null;

    async function mountPixiStage() {
      if (!hostElement) return;
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
        app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
        return;
      }

      app.canvas.style.display = "block";
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      appCanvas = app.canvas;
      hostElement.replaceChildren(app.canvas);

      const effects = SpriteEffectLayer(pixi);
      const world = new pixi.Container();
      const backgroundLayer = new pixi.Container();
      const distantLayer = new pixi.Container();
      const rainBaseLayer = new pixi.Container();
      const fogLayer = new pixi.Container();
      const groundLayer = new pixi.Container();
      const propsLayer = new pixi.Container();
      const unitsLayer = new pixi.Container();
      const smokeLayer = new pixi.Container();
      const hitEffectsLayer = new pixi.Container();
      const floatingTextLayer = new pixi.Container();
      const hudLayer = new pixi.Container();
      const vignetteLayer = new pixi.Container();

      world.addChild(
        backgroundLayer,
        distantLayer,
        rainBaseLayer,
        fogLayer,
        groundLayer,
        propsLayer,
        unitsLayer,
        smokeLayer,
        hitEffectsLayer,
        floatingTextLayer,
        hudLayer,
        vignetteLayer,
      );
      app.stage.addChild(world);

      const particles: RuntimeParticle[] = [];
      const floatingTexts: Array<{ node: Text; born: number; vy: number }> = [];
      const timeline = createCombatTimelineState();
      const start = performance.now();

      const makeRect = (x: number, y: number, width: number, height: number, color: number, alpha = 1) => {
        const graphic = new pixi.Graphics();
        graphic.rect(x, y, width, height).fill({ color, alpha });
        return graphic;
      };

      const createFloatingText = (text: string, x: number, y: number, color: number) => {
        floatingTexts.push(effects.createFloatingText(floatingTextLayer, text, x, y, color));
      };

      const createSmokeBurst = (x: number, y: number) => {
        effects.createSmokeBurst(smokeLayer, particles, x, y);
      };

      const createArquebusShot = (x: number, y: number) => {
        effects.createArquebusShot(hitEffectsLayer, particles, x, y);
        createSmokeBurst(x + 58, y);
      };

      const shakeCamera = (intensity = combatShakePreset.shot) => {
        timeline.shake = Math.max(timeline.shake, intensity);
      };

      const showOutcomeBadge = () => {
        const badge = new pixi.Container();
        const plate = new pixi.Graphics();
        plate.roundRect(-168, -55, 336, 110, 8).fill({ color: result.success ? 0x6f5529 : 0x651b1b, alpha: 0.96 });
        plate.stroke({ width: 2, color: 0xe0c284, alpha: 0.9 });
        const label = new pixi.Text({
          text: result.success ? "ÉXITO" : "FRACASO",
          style: {
            fill: 0xfff2d0,
            fontFamily: "Georgia, serif",
            fontSize: 44,
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

      // Determine what weapon the player is using for this mission
      const mission = missionId ? getMission(missionId) : null;
      const scenePlan = buildCombatScenePlan({ missionType: mission?.type, result });
      const relevantStat = scenePlan.relevantStat;
      const enemyWeapon = scenePlan.enemyWeapon === "sword" ? "pike" : scenePlan.enemyWeapon;

      // Try to load textures
      let playerTexture: Texture | null = null;
      let enemyTexture: Texture | null = null;
      let bgTexture: Texture | null = null;
      let walkSheetTexture: Texture | null = null;
      let pikeAttackSheetTexture: Texture | null = null;
      let swordAttackSheetTexture: Texture | null = null;
      const missionSpriteTextures = new Map<string, Texture>();

      try {
        let playerPath = "/assets/combat/units/arquebusier_player.png";
        if (relevantStat === "pike") playerPath = "/assets/combat/units/pikeman_player.png";
        else if (relevantStat === "sword") playerPath = "/assets/combat/units/rodelero_player.png";
        else if (relevantStat === "discipline") playerPath = "/assets/combat/units/pikeman_player.png";

        const enemyFallbackPath = enemyWeapon === "arquebus" ? "/assets/combat/units/arquebusier_enemy.png" : "/assets/combat/units/pikeman_enemy.png";
        const bgPath = getMissionSceneImagePath(missionId);

        [playerTexture, enemyTexture, bgTexture, walkSheetTexture, pikeAttackSheetTexture, swordAttackSheetTexture] = await Promise.all([
          pixi.Assets.load(playerPath).catch(() => null),
          pixi.Assets.load(result.enemy.spritePath ?? enemyFallbackPath).catch(() => pixi.Assets.load(enemyFallbackPath).catch(() => null)),
          pixi.Assets.load(bgPath).catch(() => pixi.Assets.load("/assets/gpt-bank/scenes/events/night_watch_rain_bg.png").catch(() => null)),
          pixi.Assets.load("/assets/gpt-bank/characters/diego/sprites/diego_sprite_caminar.png").catch(() => null),
          pixi.Assets.load("/assets/gpt-bank/characters/diego/sprites/diego_sprite_ataque_pica.png").catch(() => null),
          pixi.Assets.load("/assets/gpt-bank/characters/diego/sprites/diego_sprite_golpe_espada.png").catch(() => null),
        ]);

        await Promise.all(
          scenePlan.loadedSpriteIds.map(async (spriteId) => {
            const spritePath = getMissionCombatSpritePath(spriteId);
            if (!spritePath) return;
            const texture = await pixi.Assets.load(spritePath).catch(() => null);
            if (texture) missionSpriteTextures.set(spriteId, texture);
          }),
        );
      } catch (err) {
        console.warn("Error loading textures:", err);
      }

      if (bgTexture) {
        const bgSprite = new pixi.Sprite(bgTexture);
        bgSprite.width = COMBAT_CANVAS_WIDTH;
        bgSprite.height = COMBAT_CANVAS_HEIGHT;
        backgroundLayer.addChild(bgSprite);
      } else {
        backgroundLayer.addChild(makeRect(0, 0, COMBAT_CANVAS_WIDTH, COMBAT_CANVAS_HEIGHT, 0x15110d));
        backgroundLayer.addChild(makeRect(0, 0, COMBAT_CANVAS_WIDTH, 380, 0x1e211f, 0.58));
      }

      if (!bgTexture) {
        const fort = new pixi.Graphics();
        fort.rect(0, 292, COMBAT_CANVAS_WIDTH, 126).fill({ color: 0x090a0a, alpha: 0.62 });
        for (let i = 0; i < 9; i++) {
          fort.rect(i * 168 + 26, 208 + (i % 2) * 28, 92, 112).fill({ color: 0x0c0d0d, alpha: 0.52 });
        }
        distantLayer.addChild(fort);

        const torchGlow = new pixi.Graphics();
        torchGlow.circle(125, 455, 72).fill({ color: 0xd48632, alpha: 0.13 });
        torchGlow.rect(118, 434, 10, 40).fill(0xd48632);
        fogLayer.addChild(torchGlow);
      }

      const fog = new pixi.Graphics();
      fog.ellipse(640, 320, 540, 135).fill({ color: 0xc8c0aa, alpha: 0.052 });
      fog.ellipse(400, 442, 540, 82).fill({ color: 0xb2ad9c, alpha: 0.046 });
      fogLayer.addChild(fog);

      if (!bgTexture) {
        const ground = new pixi.Graphics();
        ground.rect(0, 500, COMBAT_CANVAS_WIDTH, 220).fill(0x211914);
        for (let i = 0; i < 22; i++) {
          ground.moveTo(i * 72, 558 + (i % 4) * 17).lineTo(i * 72 + 54, 558 + (i % 4) * 17).stroke({ width: 4, color: 0x17110e, alpha: 0.85 });
        }
        groundLayer.addChild(ground);

        const cart = new pixi.Graphics();
        cart.rect(430, 456, 176, 70).fill(0x5c3b22);
        cart.rect(456, 414, 124, 52).fill(0x6b4527);
        cart.circle(464, 538, 22).fill(0x090807);
        cart.circle(570, 538, 22).fill(0x090807);
        cart.rect(474, 392, 88, 22).fill({ color: 0x30241b, alpha: 0.95 });
        propsLayer.addChild(cart);
      }

      // Slice sheet helper function
      const sliceSheet = (sheetTexture: Texture, frameWidth: number, frameHeight: number): Texture[] => {
        if (!sheetTexture) return [];
        const frames: Texture[] = [];
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

      const sliceMissionFrames = (sheetTexture: Texture, frame: SpriteSheetRef): Texture[] => {
        if (!sheetTexture) return [];
        const frames: Texture[] = [];
        const row = frame.row ?? 0;
        for (let i = 0; i < frame.frames; i++) {
          const rect = new pixi.Rectangle(i * frame.frameWidth, row * frame.frameHeight, frame.frameWidth, frame.frameHeight);
          frames.push(
            new pixi.Texture({
              source: sheetTexture.source,
              frame: rect,
            }),
          );
        }
        return frames;
      };

      const missionAnimations = new Map<string, MissionAnimation>();

      for (const [spriteId, texture] of missionSpriteTextures) {
        const spriteSet = getMissionCombatSpriteSet(spriteId);
        if (!spriteSet) continue;
        missionAnimations.set(spriteId, {
          set: spriteSet,
          idle: sliceMissionFrames(texture, spriteSet.frames.idle),
          walk: sliceMissionFrames(texture, spriteSet.frames.walk),
          attack: sliceMissionFrames(texture, spriteSet.frames.attack),
          hurt: sliceMissionFrames(texture, spriteSet.frames.hurt),
        });
      }

      const createMissionSprite = (spriteId: string, scale: number, facing: 1 | -1): MissionSpriteRuntime | null => {
        const animation = missionAnimations.get(spriteId);
        if (!animation?.idle.length) return null;
        const sprite = new pixi.Sprite(animation.idle[0]);
        sprite.anchor.set(0.5, 0.92);
        sprite.scale.set(scale * facing, scale);
        return { sprite, animation, baseScale: scale, facing };
      };

      const createSceneSprite = (actor: CombatSceneActor) => {
        const runtime = createMissionSprite(actor.spriteId, actor.scale, actor.facing);
        if (!runtime) return null;
        runtime.sprite.x = actor.x;
        runtime.sprite.y = actor.y;
        runtime.sprite.alpha = actor.alpha;
        return { actor, runtime };
      };

      const setMissionSpriteFrame = (
        runtime: MissionSpriteRuntime | null,
        state: "idle" | "walk" | "attack" | "hurt",
        elapsed: number,
      ) => {
        if (!runtime) return;
        const frames = runtime.animation[state].length ? runtime.animation[state] : runtime.animation.idle;
        const frameDef = runtime.animation.set.frames[state];
        const frameIndex = Math.floor((elapsed / 1000) * frameDef.fps) % frames.length;
        runtime.sprite.texture = frames[frameIndex];
        runtime.sprite.scale.set(runtime.baseScale * runtime.facing, runtime.baseScale);
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

      let player: Sprite | ReturnType<typeof LayeredSoldierSprite>;
      let animatedPlayerSprite: Sprite | null = null;
      let isAnimatedPlayer = false;
      const playerSceneSprite = createSceneSprite(scenePlan.player);
      const playerMissionSprite = playerSceneSprite?.runtime ?? null;

      if (playerMissionSprite) {
        player = playerMissionSprite.sprite;
      } else if (canAnimate) {
        const walkPlayerSprite = new pixi.Sprite(walkFrames[0]);
        walkPlayerSprite.anchor.set(0.5, 0.94);
        walkPlayerSprite.scale.set(walkScale);
        walkPlayerSprite.y = 575;
        animatedPlayerSprite = walkPlayerSprite;
        player = walkPlayerSprite;
        isAnimatedPlayer = true;
      } else if (playerTexture) {
        const playerSprite = new pixi.Sprite(playerTexture);
        playerSprite.anchor.set(0.5, 0.94);
        playerSprite.scale.set(0.26);
        playerSprite.y = 575;
        player = playerSprite;
      } else {
        player = LayeredSoldierSprite(pixi, { kind: "tercioRecruit", weapon: "arquebus", facing: 1, scale: 1.08 });
        player.y = 450;
      }
      player.x = combatAnimationPreset.playerStartX;
      player.alpha = 0;

      let enemy: Sprite | ReturnType<typeof LayeredSoldierSprite>;
      const enemySceneSprite = createSceneSprite(scenePlan.enemy);
      const enemyMissionSprite = enemySceneSprite?.runtime ?? null;
      if (enemyMissionSprite) {
        enemy = enemyMissionSprite.sprite;
      } else if (enemyTexture) {
        const enemySprite = new pixi.Sprite(enemyTexture);
        enemySprite.anchor.set(0.5, 0.94);
        const enemyScale = Math.min(0.34, 240 / Math.max(enemyTexture.height, 1));
        enemySprite.scale.set(-enemyScale, enemyScale);
        enemySprite.y = 592;
        enemy = enemySprite;
      } else {
        enemy = LayeredSoldierSprite(pixi, { kind: "enemyScout", weapon: enemyWeapon, facing: -1, scale: 1.05 });
        enemy.y = 450;
      }
      enemy.x = combatAnimationPreset.enemyStartX;
      enemy.alpha = 0;

      const supportSprites = scenePlan.support.map(createSceneSprite).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

      unitsLayer.addChild(
        ...supportSprites.map((entry) => entry.runtime.sprite),
        player,
        enemy,
      );

      // White overlay for combat flashes (arquebus shot, weapon impact)
      const flashOverlay = new pixi.Graphics();
      flashOverlay.rect(0, 0, COMBAT_CANVAS_WIDTH, COMBAT_CANVAS_HEIGHT).fill({ color: 0xffffff, alpha: 0 });
      hudLayer.addChild(flashOverlay);

      const vignette = new pixi.Graphics();
      vignette.rect(0, 0, COMBAT_CANVAS_WIDTH, COMBAT_CANVAS_HEIGHT).stroke({ width: 34, color: 0x000000, alpha: 0.35 });
      vignetteLayer.addChild(vignette);

      const { layer: rainLayer, drops: rainDrops } = effects.createRainLayer(COMBAT_CANVAS_WIDTH, COMBAT_CANVAS_HEIGHT);
      rainBaseLayer.addChild(rainLayer);

      resizeObserver = new ResizeObserver(([entry]) => {
        const width = entry.contentRect.width;
        hostElement.style.height = `${width * (COMBAT_CANVAS_HEIGHT / COMBAT_CANVAS_WIDTH)}px`;
        app?.renderer.resize(COMBAT_CANVAS_WIDTH, COMBAT_CANVAS_HEIGHT);
      });
      resizeObserver.observe(hostElement);

      completionTimer = window.setTimeout(() => onSequenceComplete?.(), outcomeDelayMs);

      app.ticker.add(() => {
        const now = performance.now();
        const elapsed = now - start;
        const events = CombatTimeline(elapsed, timeline, result, relevantStat);

        rainDrops.forEach((drop) => {
          drop.node.x += drop.drift;
          drop.node.y += drop.speed;
          if (drop.node.y > COMBAT_CANVAS_HEIGHT + 40) {
            drop.node.y = -40;
            drop.node.x = Math.random() * COMBAT_CANVAS_WIDTH;
          }
        });

        if (timeline.shake > 0.2) {
          world.x = (Math.random() - 0.5) * timeline.shake;
          world.y = (Math.random() - 0.5) * timeline.shake;
          timeline.shake *= combatShakePreset.decay;
        } else {
          world.x *= 0.78;
          world.y *= 0.78;
        }

        // Screen Flash fade logic
        if (flashOverlay.alpha > 0.01) {
          flashOverlay.alpha *= 0.82;
        } else {
          flashOverlay.alpha = 0;
        }

        player.alpha = Math.min(1, Math.max(0, (elapsed - 800) / 500));
        enemy.alpha = Math.min(1, Math.max(0, (elapsed - 1050) / 600));
        player.x += (combatAnimationPreset.playerReadyX - player.x) * 0.04;
        enemy.x += (combatAnimationPreset.enemyReadyX - enemy.x) * 0.04;
        
        const playerBaseY = playerMissionSprite ? scenePlan.player.y : (playerTexture || isAnimatedPlayer) ? 575 : 450;
        const enemyBaseY = enemyMissionSprite ? scenePlan.enemy.y : enemyTexture ? 592 : 450;
        
        player.y = playerBaseY + Math.sin(elapsed * 0.007) * 5;
        enemy.y = enemyBaseY + Math.cos(elapsed * 0.006) * 3;

        setMissionSpriteFrame(playerMissionSprite, getActorStateAt(scenePlan.player, elapsed), elapsed);
        setMissionSpriteFrame(enemyMissionSprite, getActorStateAt(scenePlan.enemy, elapsed), elapsed);
        supportSprites.forEach(({ actor, runtime }, index) => {
          setMissionSpriteFrame(runtime, getActorStateAt(actor, elapsed), elapsed + index * 90);
        });

        // Animate spritesheet texture frames based on current time elapsed
        if (!playerMissionSprite && animatedPlayerSprite) {
          if (elapsed < 900) {
            animatedPlayerSprite.texture = walkFrames[0];
            animatedPlayerSprite.scale.set(walkScale);
          } else if (elapsed >= 900 && elapsed < 2200) {
            // walking loop during deployment
            const walkSpeed = 120;
            const frameIndex = Math.floor((elapsed - 900) / walkSpeed) % 3;
            animatedPlayerSprite.texture = walkFrames[frameIndex];
            animatedPlayerSprite.scale.set(walkScale);
          } else if (elapsed >= 2200 && elapsed < 2550) {
            // standing guard/idle pose
            animatedPlayerSprite.texture = walkFrames[1];
            animatedPlayerSprite.scale.set(walkScale);
          } else if (elapsed >= 2550 && elapsed < 3350) {
            // attack lunges and hits
            if ((relevantStat === "pike" || relevantStat === "discipline") && pikeFrames.length > 0) {
              const attackElapsed = elapsed - 2550;
              let frameIdx = 0;
              if (attackElapsed > 550) frameIdx = 2; // recovery
              else if (attackElapsed > 150) frameIdx = 1; // thrust forward
              animatedPlayerSprite.texture = pikeFrames[frameIdx];
              animatedPlayerSprite.scale.set(pikeScale);
            } else if (relevantStat === "sword" && swordFrames.length > 0) {
              const attackElapsed = elapsed - 2550;
              let frameIdx = 0;
              if (attackElapsed > 550) frameIdx = 2; // recovery
              else if (attackElapsed > 150) frameIdx = 1; // slash hit
              animatedPlayerSprite.texture = swordFrames[frameIdx];
              animatedPlayerSprite.scale.set(swordScale);
            } else {
              animatedPlayerSprite.texture = walkFrames[1];
              animatedPlayerSprite.scale.set(walkScale);
            }
          } else {
            // post-attack guard pose
            animatedPlayerSprite.texture = walkFrames[1];
            animatedPlayerSprite.scale.set(walkScale);
          }
        }

        if (events.showModifier) {
          const modifier = result.modifiers[timeline.modifierIndex];
          createFloatingText(`${modifier.value >= 0 ? "+" : ""}${modifier.label}: ${modifier.value}`, 330, 250 + timeline.modifierIndex * 34, modifier.value >= 0 ? 0xd9bf78 : 0xd05048);
          timeline.modifierIndex += 1;
        }

        if (events.fireShot) {
          if (scenePlan.actionKind === "shot") {
            createArquebusShot(scenePlan.impact.x, scenePlan.impact.y);
            player.rotation = -0.035;
            shakeCamera(combatShakePreset.shot);
            flashOverlay.alpha = scenePlan.impact.flashAlpha;
          } else {
            // Melee charge/lunge forward
            player.x += scenePlan.impact.lunge;
            player.rotation = 0.04;
            shakeCamera(combatShakePreset.clash);
            flashOverlay.alpha = scenePlan.impact.flashAlpha;
          }
          createFloatingText(`Tirada determinista: +${result.roll}`, COMBAT_CANVAS_WIDTH / 2, 162, 0xffdc68);
        }

        if (events.enemyResponse) {
          enemy.x -= 42;
          player.rotation = 0;
          effects.createSparkBurst(hitEffectsLayer, particles, scenePlan.impact.x, scenePlan.impact.y);
          createFloatingText("¡Choque de armas!", COMBAT_CANVAS_WIDTH / 2, 238, 0xf2e0b8);
          shakeCamera(combatShakePreset.clash);
          flashOverlay.alpha = 0.55;
        }

        if (events.showOutcome) {
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

    mountPixiStage();

    return () => {
      cancelled = true;
      if (completionTimer !== null) window.clearTimeout(completionTimer);
      resizeObserver?.disconnect();
      if (app) {
        app.ticker?.stop();
        try {
          app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
        } catch {
          appCanvas?.remove();
        }
      }
      hostElement?.replaceChildren();
    };
  }, [missionId, missionTitle, onSequenceComplete, result]);

  return (
    <div className="relative w-full bg-stone-950">
      <div ref={hostRef} className="aspect-video w-full overflow-hidden bg-stone-950" />
    </div>
  );
}
