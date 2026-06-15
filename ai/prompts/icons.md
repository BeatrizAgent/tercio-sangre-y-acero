# Item Icon Prompts

Use these as manual ChatGPT prompts for inventory icons. Save outputs into `GPT-ASSETS`, then run the local cleanup/index flow.

## Base Style

Clean historical painterly game asset, early modern Spanish tercio era, isolated object, transparent or flat magenta background, full object visible, readable silhouette, no text, no hands, no modern gear, no fantasy ornament, natural iron, leather, linen, wood, muted premium palette.

## Negative Style

No magic, no fantasy weapon, no glowing runes, no modern firearm, no modern military gear, no logo, no readable text, no UI frame, no busy background, no explicit gore.

## Output Contract

- One centered object.
- Plenty of padding for cropping.
- PNG preferred.
- Use `scripts/process_gpt_assets.py --commit` after saving a batch.
- Use `scripts/build_asset_bank.py` to refresh `data/assets.json`.

## Mature SFW Variant

For harsh historical props, show aftermath indirectly: broken straps, dirty cloth, covered bundle, smoke, mud, stained ground, bandages. Mark linked event `mature: true` and `presentation: "blurred"` in data.
