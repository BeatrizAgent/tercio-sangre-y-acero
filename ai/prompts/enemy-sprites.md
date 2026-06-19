# Enemy Sprite Prompts

Manual ChatGPT prompt batch for full-body enemy idles. Save outputs
into `GPT-ASSETS/enemigos/sprites/`. Six factions, one idle each.

## Base style

Single full-body enemy soldier, isolated on flat magenta background,
historical, painterly, readable silhouette, same height as Diego's
base sprite (768x1024 or 3:4), three-quarter view, no modern gear,
no fantasy, no text.

## Negative style

No anime, no fantasy armor, no demon wings, no glowing eyes, no
readable insignia, no modern camouflage, no fantasy runes.

## Output contract

- 768x1024 PNG minimum, 3:4 ratio.
- Flat magenta background for the cleanup script.
- After saving all six, run:
  ```text
  python scripts/process_gpt_assets.py --commit
  python scripts/build_asset_bank.py
  python tests/validate_asset_bank.py
  ```

## Per-faction prompts

1. `sprite_enemy_bandit_idle.png` — Hungry deserter, ragged
   doublet, mismatched gear, empty scabbard, no text.
2. `sprite_enemy_french_idle.png` — French-style arquebusier
   in light cuirass and brimmed hat, bandolier, no text.
3. `sprite_enemy_protestant_idle.png` — German-style landsknecht
   in slashed doublet, broad felt hat, no text.
4. `sprite_enemy_italian_idle.png` — Italian condottiero in
   light sallet and partial plate, no text.
5. `sprite_enemy_moor_idle.png` — North African soldier in
   light mail and a turban-like wrap, no text.
6. `sprite_enemy_turk_idle.png` — Ottoman-style soldier in
   turban, light mail, curved blade at side, no text.

## Mature SFW variant

All enemy idles are clean: torn but not bloody, tired but not
dying. No variant required for this batch.
