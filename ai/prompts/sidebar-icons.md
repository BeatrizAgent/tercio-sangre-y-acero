# Sidebar Icon Prompts

Manual ChatGPT prompt batch for the eight navigation glyphs in the left
sidebar. Each output is saved into `GPT-ASSETS/ui/sidebar/` and renamed
automatically by `scripts/process_gpt_assets.py`.

## Base style

Centered, single-subject painterly glyph, 512x512 PNG, early modern
Spanish tercio era, dark iron background frame, restrained warm gold rim,
slight worn-metal surface, isolated object or silhouette, no text, no
modern gear, no fantasy ornament, no background detail.

## Negative style

No text inside the icon. No modern, no fantasy. No gradients or
glow effects. No busy background. No multi-color palette: keep to iron,
bronze, warm gold, dim cream, and one accent of dark red.

## Output contract

- One centered glyph per image.
- Plenty of padding (at least 32 px) for cropping to 24/32/48 px.
- PNG with flat magenta background for `process_gpt_assets.py` cleanup.
- After saving all eight, run:
  ```text
  python scripts/process_gpt_assets.py --commit
  python scripts/build_asset_bank.py
  python tests/validate_asset_bank.py
  ```

## Per-icon prompts

### 1. `icon_sidebar_cuartel.png` — Barracks

Conical iron morion resting on a folded wool camp blanket, dim warm gold
rim, dark iron background frame, no text, painterly.

### 2. `icon_sidebar_soldado.png` — Soldier

Half-silhouette of a pikeman in morion and gorget, head and shoulders,
dim warm gold rim, no text, painterly.

### 3. `icon_sidebar_entrenar.png` — Training

Two crossed pike shafts with dull iron tips, leather wraps at the
crossing, dim warm gold rim, no text, painterly.

### 4. `icon_sidebar_inventario.png` — Inventory

Open leather satchel with a metal buckle, no contents visible, dim warm
gold rim, no text, painterly.

### 5. `icon_sidebar_equipo.png` — Equipment

Brigantine cuirass front view, leather shoulder straps, dim warm gold
rim, no text, painterly.

### 6. `icon_sidebar_armeria.png` — Armory

Smith's hammer crossed over a flat anvil, soot-darkened iron, dim warm
gold rim, no text, painterly.

### 7. `icon_sidebar_misiones.png` — Missions

Tattered burgundy cross banner hanging from a wooden pole, slight
wind, dim warm gold rim, no text, painterly.

### 8. `icon_sidebar_hospital.png` — Hospital

Mortar and pestle with a small clay jar, dried herb sprig, dim warm gold
rim, no text, painterly.

## Mature SFW variant

All sidebar icons are non-violent and non-grim. No variant required.
