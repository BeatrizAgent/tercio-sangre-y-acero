# Sprite Pipeline

Sprites are optional flavor for combat and avatar previews. Core gameplay remains web UI.

## Manual Asset Flow

1. Prompt the sprite or pose manually in ChatGPT.
2. Save PNG files into `GPT-ASSETS` under the closest category.
3. Run `python scripts/process_gpt_assets.py --commit` to remove matte backgrounds and normalize names.
4. Run `python scripts/build_asset_bank.py` to refresh `data/assets.json`.
5. Copy only selected runtime-ready sprites into `web/public/assets/combat` when a canvas feature needs them.

## Style Rules

- Early modern Spanish tercio clothing and equipment.
- Transparent PNG preferred.
- No modern gear.
- No fantasy armor.
- No explicit gore.
- Harsh historical visuals must use indirect SFW composition and blurred presentation in data.

## Runtime Contract

- Keep shipped game usable with placeholders until final sprites are selected.
- Sprite dimensions should be consistent per animation set.
- Add each runtime sprite to the combat sprite manifest before using it.

## Sprite Animation Pipeline Details

- **Asset Generation**: We use manual ChatGPT assets as the source of our drawings.
- **Editing and Frame Slicing**: Software like Aseprite can be used to manually edit frames, clean pixel outlines, or adjust animations.
- **Packing**: TexturePacker can compile frames into optimized spritesheets, although we also support manual horizontal spritesheets for single units.
- **Reference**: The Soldier sprite reference is defined in `web/src/lib/combat/sprite-manifest.ts` mapping names to asset IDs.

