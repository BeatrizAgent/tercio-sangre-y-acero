# Combat Resolution Canvas

## Why PixiJS

The mission resolution scene is visual theater, not a playable battle system. PixiJS gives the app fast layered 2D rendering for rain, fog, smoke, silhouettes, sparks, muzzle flashes, and camera shake while keeping the rest of **Tercio: Sangre y Acero** in normal React and HTML UI.

## Why not Phaser

Phaser is better suited for a complete game loop, input model, scenes, collisions, and game-state ownership. This feature only needs a modal animation inside an existing management RPG flow, so Phaser would add weight and imply a real-time combat direction the project does not want yet.

Phaser is not used because this remains a deterministic resolution theater inside the existing React UI, not tactical or real-time combat.

## Component API

`CombatResolutionModal` receives:

```ts
{
  open: boolean;
  onClose: () => void;
  missionTitle: string;
  result: CombatResult;
  onContinue: () => void;
}
```

`CombatStage` owns the manual PixiJS `Application`, 16:9 resize behavior, ticker, layers, particles, and cleanup. `CombatResult` contains success/failure, deterministic roll, target, modifiers, rewards, wound summary, and campaign log lines. Existing mission pages can keep using `MissionCanvasResolver`, which now adapts mission + soldier data into `CombatResolutionModal`.

## Asset folders

Current placeholders are Pixi `Graphics` and `Text`, with folders ready for replacement assets:

- `public/assets/combat/sprites/soldiers/`
- `public/assets/combat/sprites/enemies/`
- `public/assets/combat/spritesheets/`
- `public/assets/combat/backgrounds/`
- `public/assets/combat/props/`
- `public/assets/combat/fx/`
- `public/assets/combat/audio/`

## Replacing placeholders

Replace `Graphics` soldiers, pikes, arquebuses, carts, and flashes in `CombatCanvas.tsx` with loaded Pixi sprites later. Keep the same layer order:

1. background
2. far silhouettes
3. ground
4. props
5. units
6. rain
7. smoke/fx
8. HUD
9. floating text

Use transparent PNG/WebP sprites with matching 16:9 composition. Generated assets should stay historical, clean painterly, non-fantasy, non-anime, and early-modern.

## Cleanup notes for Next.js

`CombatStage` imports PixiJS dynamically inside `useEffect` so SSR never touches WebGL APIs. On unmount it stops the dedicated ticker, disconnects the `ResizeObserver`, removes the canvas, and destroys display children while avoiding aggressive texture destruction for future shared real assets.

## Animation sequence

1. Fade in dark battlefield.
2. Rain moves across the scene.
3. Mission title fades in.
4. Player line and enemy silhouettes appear.
5. Modifiers and deterministic roll float in.
6. Arquebus shot triggers muzzle flash, smoke, and camera shake.
7. Enemy advances, clash sparks fire near center.
8. Outcome badge shows `ÉXITO` or `FALLO`.
9. Continue button becomes available in the React HUD.

## Sound next steps

Dependencies include `howler` and `@pixi/sound` for later hooks. Keep sound optional and user-toggleable. Suggested events: drum fade-in, matchlock shot, metal clash, victory/defeat sting.
