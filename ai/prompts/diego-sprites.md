# Diego Sprite Prompts

Manual ChatGPT prompt batch for Diego's base animation frames. Save
outputs into `GPT-ASSETS/prota/sprites-base/`. Seven base frames plus
two stained variants for a total of nine outputs.

## Base style

Single full-body character, isolated on flat magenta background,
early modern Spanish tercio clothing and gear, readable silhouette,
front or three-quarter view, neutral pose unless action frame
requested, no modern gear, no fantasy armor, no text.

## Negative style

No modern uniform, no fantasy pauldrons, no anime, no halos, no
floating icons, no readable text on the sprite, no logos.

## Output contract

- 768x1024 PNG minimum, square or 3:4 ratio.
- Flat magenta background for the cleanup script.
- After saving all frames, run:
  ```text
  python scripts/process_gpt_assets.py --commit
  python scripts/build_asset_bank.py
  python tests/validate_asset_bank.py
  ```

## Per-frame prompts

1. `sprite_diego_idle_front.png` — Diego standing at rest, pike held
   vertically at his right side, morion straight, no modern gear,
   no text.
2. `sprite_diego_idle_3q.png` — Diego at rest, three-quarter view,
   pike shouldered, no modern gear, no text.
3. `sprite_diego_walk_sheet.png` — Diego mid-stride, sheet of
   4 frames horizontal, pike shouldered, no text.
4. `sprite_diego_attack_pike_sheet.png` — Diego thrusting with a
   pike, sheet of 4 frames horizontal, no text.
5. `sprite_diego_attack_sword_sheet.png` — Diego swinging a
   cinto sword, sheet of 4 frames horizontal, no text.
6. `sprite_diego_hurt.png` — Diego clutching his shoulder, face
   down, slight stagger, no text.
7. `sprite_diego_defeated.png` — Diego on one knee, pike
   grounded beside him, no text.

## Mature SFW variant

Generate two extra frames marked `mature: true` in the bank:

- `diego_sprite_herido_sangre.png` — Hurt variant with a stained
  sleeve and a torn doublet. Use indirect SFW composition: a torn
  cloth, a damp stain, a downturned face. No explicit gore.
- `diego_sprite_derrotado_barro.png` — Defeated variant covered in
  dry mud and road dust. Painterly, no text.

Mark linked data with `mature: true` and `presentation: "blurred"`.

## Animation tip

Sheets should be saved as a single horizontal strip so the runtime
combat sprite manifest can pick frames by index. Keep cell widths
equal across all sheets.
