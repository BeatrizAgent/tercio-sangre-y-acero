# Screen Background Prompts

Manual ChatGPT prompt batch for the wide screen backgrounds. Save
outputs into `GPT-ASSETS/CG/screen_bg/`. Six backgrounds total.

## Base style

Wide painterly browser RPG scene, 1920x1080 minimum, early modern
Spanish tercio era, dark cinematic palette, plenty of negative
space on the right or center for UI panels, no modern objects, no
fantasy, no readable text. The composition must leave room for
cards and sidebars.

## Negative style

No text, no UI frames, no logo, no watermark, no fantasy creature,
no modern uniform, no readable inscriptions on banners.

## Output contract

- 1920x1080 PNG minimum. Wider is fine.
- Save with **transparent or magenta background** for the cleanup
  script.
- Negative space must be at least 35 percent of the canvas, biased
  to the right.
- After saving all six, run:
  ```text
  python scripts/process_gpt_assets.py --commit
  python scripts/build_asset_bank.py
  python tests/validate_asset_bank.py
  ```

## Per-scene prompts

1. `screen_bg_menu_principal.png` — Tented camp at dusk, banners
   hanging limp, distant watch fires, negative space on the right.
2. `screen_bg_inventario.png` — Armory interior, racks of pikes
   and morions, dim lantern, dark wooden beams, negative space on
   the right.
3. `screen_bg_equipo.png` — Barracks interior, slung hammocks,
   open footlocker, dim candle, negative space on the right.
4. `screen_bg_reportes.png` — Field scribe's desk at night,
   parchment, inkwell, candle stub, dim light, negative space on
   the right.
5. `screen_bg_rankings_future.png` — Officer's pavilion, long
   table with a map, lantern, dim light, negative space on the
   right.
6. `screen_bg_company_future.png` — Company courtyard, pike
   racks, a single banner, overcast sky, negative space on the
   right.

## Mature SFW variant

All backgrounds are moody but not graphic. No gore, no battle
carnage, no casualty imagery in this batch.
