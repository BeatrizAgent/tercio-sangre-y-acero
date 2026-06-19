# UI Texture Prompts

Manual ChatGPT prompt batch for tileable UI textures. Save outputs
into `GPT-ASSETS/ui/textures/`. Six tileable textures total.

## Base style

Painterly tileable texture, 1024x1024 or 2048x2048 PNG, early modern
Spanish tercio era, muted, readable on top of which text and
controls will sit, no hard seams when tiled, no text, no logo, no
modern pattern, no fantasy.

## Negative style

No strong gradient. No obvious seams on the four edges. No text. No
watermark. No fantasy rune. No modern branding.

## Output contract

- 1024x1024 minimum, prefer 2048x2048.
- The texture must tile without visible seams.
- Save with **transparent or magenta background** for the cleanup
  script. Magenta-tinted flat color is preferred so the cleanup
  script can normalize the corners.
- After saving all six, run:
  ```text
  python scripts/process_gpt_assets.py --commit
  python scripts/build_asset_bank.py
  python tests/validate_asset_bank.py
  ```

## Per-texture prompts

1. `texture_dark_wood_panel.png` — Dark, aged oak planks, faint
   grain, subtle knots, low contrast, tileable.
2. `texture_blackened_iron.png` — Blackened iron plate with
   faint scratches, low contrast, tileable.
3. `texture_worn_leather.png` — Worn harness leather, faint
   creases, low contrast, tileable.
4. `texture_old_parchment.png` — Old parchment, faint foxing,
   low contrast, tileable.
5. `texture_smoke_overlay.png` — Thin rising smoke, low opacity,
   transparent background, tileable horizontally.
6. `texture_grime_overlay.png` — Subtle grime streaks, low
   opacity, transparent background, tileable.

## Mature SFW variant

All textures are pure surface material. No variant required.

## CSS hint

Use these textures with controlled opacity (`0.2`-`0.4`) over
panels so they do not compete with text. The smoke and grime
overlays are designed to layer above content with a
`mix-blend-mode: multiply` style effect.
