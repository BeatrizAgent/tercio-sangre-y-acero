# Portrait Variant Prompts

Manual ChatGPT prompt batch for emotion variants on existing
portraits. Save outputs into `GPT-ASSETS/CG/portrait_variants/`.
Nine variants total.

## Base style

Half-length historical painterly portrait, early modern Spanish
tercio setting, plausible face but not a real person, sober wool
and linen clothing, iron or leather equipment where relevant, muted
colors, clean readable shape, transparent or flat magenta
background, no text, no insignia copied from real brands, no modern
costume, no fantasy styling.

The new variants must follow the same character as the original
portrait in `GPT-ASSETS/CG/portraits/`. Match clothing, gear, and
face shape so the variant slots into the same dialogue frame.

## Negative style

No modern costume, no fantasy styling, no anime, no halos, no
readable text, no celebrity likeness, no brand copy.

## Output contract

- 512x768 PNG minimum.
- Magenta background for the cleanup script.
- After saving all nine, run:
  ```text
  python scripts/process_gpt_assets.py --commit
  python scripts/build_asset_bank.py
  python tests/validate_asset_bank.py
  ```

## Per-variant prompts

### Diego (five variants)

1. `portrait_diego_neutral.png` — Diego at rest, neutral
   expression, no text.
2. `portrait_diego_tired.png` — Diego with shadowed eyes and
   stooped shoulders, dim light, no text.
3. `portrait_diego_wounded.png` — Diego with a torn sleeve and
   damp cloth, indirect SFW composition, no explicit blood, no
   text.
4. `portrait_diego_proud.png` — Diego standing tall after a
   successful mission, slight smile, no text.
5. `portrait_diego_defeated.png` — Diego downcast after a
   failed mission, no gore, no text.

### NPCs (four variants)

6. `portrait_sergeant_angry.png` — Sargento instructor with
   furrowed brow, clenched jaw, no text.
7. `portrait_armorer_neutral.png` — Armorer at his workbench,
   neutral expression, no text.
8. `portrait_surgeon_neutral.png` — Field surgeon with rolled
   sleeves, neutral expression, no text.
9. `portrait_chaplain_neutral.png` — Chaplain holding a book,
   neutral expression, no text.

## Mature SFW variant

Wounded and defeated variants use indirect SFW composition:
shadowed eyes, torn cloth, damp stain, downturned face. No
explicit blood. Mark linked data with `mature: true` and
`presentation: "blurred"`.
