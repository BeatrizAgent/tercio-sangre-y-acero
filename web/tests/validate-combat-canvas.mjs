import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/components/combat/CombatResolutionModal.tsx",
  "src/components/combat/CombatStage.tsx",
  "src/components/combat/CombatSprite.tsx",
  "src/components/combat/LayeredSoldierSprite.tsx",
  "src/components/combat/SpriteEffectLayer.tsx",
  "src/components/combat/CombatTimeline.tsx",
  "src/components/combat/CombatHud.tsx",
  "src/components/combat/CombatLog.tsx",
  "src/lib/combat/combat-types.ts",
  "src/lib/combat/combat-animation-script.ts",
  "src/lib/combat/combat-resolver.ts",
  "src/lib/combat/sprite-manifest.ts",
  "src/lib/combat/sprite-types.ts",
  "src/lib/combat/animation-presets.ts",
  "src/lib/combat/particle-presets.ts",
  "../docs/combat_canvas.md",
  "../docs/sprite_pipeline.md",
];

const requiredDirs = [
  "public/assets/combat/sprites/soldiers",
  "public/assets/combat/sprites/enemies",
  "public/assets/combat/spritesheets",
  "public/assets/combat/backgrounds",
  "public/assets/combat/props",
  "public/assets/combat/fx",
  "public/assets/combat/audio",
];

const requiredSnippets = {
  "src/components/combat/CombatStage.tsx": [
    "await import(\"pixi.js\")",
    "LayeredSoldierSprite",
    "SpriteEffectLayer",
    "CombatTimeline",
    "createRainLayer",
    "createArquebusShot",
    "createSmokeBurst",
    "createFloatingText",
    "shakeCamera",
    "showOutcomeBadge",
    "app.destroy(",
  ],
  "src/components/combat/CombatResolutionModal.tsx": [
    "CombatResolutionModal",
    "CombatStage",
    "CombatHud",
    "CombatLog",
  ],
  "src/components/combat/LayeredSoldierSprite.tsx": [
    "shadow",
    "backArm",
    "frontArm",
    "helmet",
    "fallback",
  ],
  "src/lib/combat/combat-types.ts": [
    "export type CombatResult",
    "severity: \"leve\" | \"media\" | \"grave\"",
  ],
  "src/lib/combat/combat-resolver.ts": [
    "buildCombatResult",
    "getCombatPreview",
  ],
  "src/lib/combat/sprite-manifest.ts": [
    "combatSpriteManifest",
    "tercioRecruit",
    "/assets/combat/sprites/soldiers",
  ],
  "src/lib/combat/particle-presets.ts": [
    "rainParticlePreset",
    "smokeParticlePreset",
    "sparkParticlePreset",
  ],
  "../docs/combat_canvas.md": [
    "PixiJS",
    "Phaser is not used",
    "Component API",
    "Asset folders",
  ],
  "../docs/sprite_pipeline.md": [
    "manual ChatGPT assets",
    "Aseprite",
    "TexturePacker",
    "Soldier sprite reference",
  ],
};

const failures = [];

for (const file of requiredFiles) {
  const absolute = path.resolve(root, file);
  if (!fs.existsSync(absolute)) {
    failures.push(`Missing file: ${file}`);
  }
}

for (const dir of requiredDirs) {
  const absolute = path.resolve(root, dir);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
    failures.push(`Missing directory: ${dir}`);
  }
}

for (const [file, snippets] of Object.entries(requiredSnippets)) {
  const absolute = path.resolve(root, file);
  if (!fs.existsSync(absolute)) continue;
  const text = fs.readFileSync(absolute, "utf8");
  for (const snippet of snippets) {
    if (!text.includes(snippet)) {
      failures.push(`Missing snippet in ${file}: ${snippet}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: requiredFiles.length + requiredDirs.length }));
