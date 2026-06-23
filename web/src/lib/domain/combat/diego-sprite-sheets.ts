export const DIEGO_SPRITE_SHEETS = {
  walk: {
    path: "/assets/gpt-bank/characters/diego/sprites/diego_sprite_caminar.png",
    width: 2031,
    height: 714,
    frames: 6,
    fps: 8,
  },
  pikeAttack: {
    path: "/assets/gpt-bank/characters/diego/sprites/diego_sprite_ataque_pica.png",
    width: 2076,
    height: 570,
    frames: 6,
    fps: 7,
  },
  swordAttack: {
    path: "/assets/gpt-bank/characters/diego/sprites/diego_sprite_golpe_espada.png",
    width: 2141,
    height: 642,
    frames: 6,
    fps: 7,
  },
} as const;

export function getDiegoFrameWidth(sheet: keyof typeof DIEGO_SPRITE_SHEETS) {
  const config = DIEGO_SPRITE_SHEETS[sheet];
  return config.width / config.frames;
}

export function getLinearFrameIndex(elapsedMs: number, frameCount: number, frameDurationMs: number) {
  if (frameCount <= 1) return 0;
  return Math.min(frameCount - 1, Math.max(0, Math.floor(elapsedMs / frameDurationMs)));
}
