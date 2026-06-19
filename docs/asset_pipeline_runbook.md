# Asset Pipeline Runbook

End-to-end recipe for growing the GPT-ASSETS bank. The pipeline is
manual at the front (ChatGPT) and automated at the back (Python).

## At a glance

```text
1. Pick a prompt sheet in ai/prompts/
2. Run the prompt in ChatGPT, save PNGs into GPT-ASSETS/<category>/
3. python scripts/process_gpt_assets.py --commit
4. python scripts/build_asset_bank.py
5. python tests/validate_asset_bank.py
6. python scripts/audit_asset_links.py
7. node web/scripts/sync-data.mjs
```

## Folder map

| Target folder | Prefix in `asset_id` | Category in `data/assets.json` |
|---|---|---|
| `GPT-ASSETS/armadura/` | `armadura_*` | `equipment` |
| `GPT-ASSETS/armas/` | `arma_*` | `weapon` |
| `GPT-ASSETS/auxiliares/` | `auxiliar_*` | `support` |
| `GPT-ASSETS/CG/cg_events/` | `*_bg` | `scene` |
| `GPT-ASSETS/CG/portraits/` | `*_portrait` | `portrait` |
| `GPT-ASSETS/CG/portrait_variants/` | `retrato_*` | `portrait_variant` |
| `GPT-ASSETS/CG/screen_bg/` | `screen_bg_*` | `screen_background` |
| `GPT-ASSETS/CG/sprites_events/` | `evento_sprite`, `evento_*` | `event_sprite` |
| `GPT-ASSETS/enemigos/chusma/` | `enemigo_chusma_*` | `enemy` |
| `GPT-ASSETS/enemigos/franceses/` | `enemigo_frances_*` | `enemy` |
| `GPT-ASSETS/enemigos/italianos/` | `enemigo_italiano_*` | `enemy` |
| `GPT-ASSETS/enemigos/moros/` | `enemigo_moro_*` | `enemy` |
| `GPT-ASSETS/enemigos/protestantes/` | `enemigo_protestante_*` | `enemy` |
| `GPT-ASSETS/enemigos/turcos/` | `enemigo_turco_*` | `enemy` |
| `GPT-ASSETS/enemigos/sprites/` | `enemigo_sprite_*` | `enemy_sprite_base` |
| `GPT-ASSETS/epics/` | `epica_*` | `scene` |
| `GPT-ASSETS/icons-ui/` | `icono_ui_*` | `ui` |
| `GPT-ASSETS/otros/` | `objeto_*` | `prop` |
| `GPT-ASSETS/prota/` | `diego_*` | `character` |
| `GPT-ASSETS/prota/emociones/` | `diego_emocion_*`, `*_retrato` | `character_emotion` |
| `GPT-ASSETS/prota/sprites-animation/` | `diego_sprite_*` | `character_sprite` |
| `GPT-ASSETS/prota/sprites-base/` | `diego_sprite_*` | `character_sprite_base` |
| `GPT-ASSETS/tercios/` | `tercio_*` | `character` |
| `GPT-ASSETS/tercios/emociones/` | `tercio_emocion_*` | `character_emotion` |
| `GPT-ASSETS/ui/sidebar/` | `icono_sidebar_*` | `sidebar_icon` |
| `GPT-ASSETS/ui/resource/` | `icono_recurso_*`, `icono_estado_*` | `resource_icon` |
| `GPT-ASSETS/ui/action/` | `icono_accion_*` | `action_icon` |
| `GPT-ASSETS/ui/frames/` | `marco_ui_*` | `ui_frame` |
| `GPT-ASSETS/ui/ornaments/` | `ornamento_ui_*` | `ornament` |
| `GPT-ASSETS/ui/textures/` | `textura_ui_*` | `ui_texture` |

## Step 1: pick a prompt sheet

Open the matching file in [`ai/prompts/`](../ai/prompts/):

- Sidebar glyphs: [sidebar-icons.md](../ai/prompts/sidebar-icons.md)
- Resource and status icons: [resource-status-icons.md](../ai/prompts/resource-status-icons.md)
- Action icons: [action-icons.md](../ai/prompts/action-icons.md)
- UI 9-slice frames: [ui-9-slice.md](../ai/prompts/ui-9-slice.md)
- UI ornaments: [ornaments.md](../ai/prompts/ornaments.md)
- Diego base sprites: [diego-sprites.md](../ai/prompts/diego-sprites.md)
- Enemy full-body idles: [enemy-sprites.md](../ai/prompts/enemy-sprites.md)
- Screen backgrounds: [screen-bg.md](../ai/prompts/screen-bg.md)
- UI textures: [textures.md](../ai/prompts/textures.md)
- Portrait variants: [portrait-variants.md](../ai/prompts/portrait-variants.md)
- Event scenes: [event-scenes.md](../ai/prompts/event-scenes.md)

Each file lists the per-asset prompt block you copy-paste into
ChatGPT. The filenames in the prompts are **also** registered in
`scripts/process_gpt_assets.py` under `DESCRIPTIVE_RENAMES`, so when
the export lands in the right folder it will be renamed
automatically on the next processing pass.

## Step 2: save into the right folder

Drag the ChatGPT export into the matching `GPT-ASSETS/<category>/`
folder. Keep the magenta background; the cleanup script needs it.
For 9-slice frames and UI textures prefer a transparent background
when possible.

## Step 3: process and clean

```bash
python scripts/process_gpt_assets.py --commit
```

This:

- Walks every PNG in `GPT-ASSETS/`.
- Applies the magenta-key cleanup if a magenta border is detected.
- Renames to the canonical `*_NNN.png` form, or to the pre-seeded
  descriptive name from `DESCRIPTIVE_RENAMES`.
- Writes `asset_manifest.json` and `rename_manifest.json`.

## Step 4: rebuild the data bank

```bash
python scripts/build_asset_bank.py
```

This:

- Regenerates [data/assets.json](../data/assets.json).
- Re-stamps `assetId` / `portraitAssetId` / `sceneAssetId` for items,
  enemies, missions, events, shops, training, and report fragments.
- Re-stamps `iconAssetId` for ranks.
- Uses the safe "stamp only if asset exists" helper for the new
  tables so the script is a no-op when the bank is still incomplete.

## Step 5: validate

```bash
python tests/validate_asset_bank.py
python scripts/audit_asset_links.py
```

The validator checks file presence, dimensions, presentation,
mirror under `web/public/assets/gpt-bank/`, and the dynamic bank
floor (442 today). The audit script also produces a per-batch
todo in [DESIGN/recursos-faltantes.next.md](../DESIGN/recursos-faltantes.next.md).

## Step 6: sync to the web client

```bash
node web/scripts/sync-data.mjs
```

This mirrors the JSON data into `web/data/json/` and copies the
entire `GPT-ASSETS/` tree into `web/public/assets/gpt-bank/`. The
game runtime reads from there.

## Adding a new prompt sheet

1. Create a new file in `ai/prompts/` following the same format
   (Base style, Negative style, Output contract, per-asset prompts).
2. Decide the target folder under `GPT-ASSETS/` and the asset_id
   prefix.
3. Register the folder in `PREFIXES` inside
   [scripts/process_gpt_assets.py](../scripts/process_gpt_assets.py).
4. Register the folder in `CATEGORY_BY_DIR` inside
   [scripts/build_asset_bank.py](../scripts/build_asset_bank.py).
5. Pre-seed the expected filenames in `DESCRIPTIVE_RENAMES` so
   the cleanup step renames the future exports automatically.
6. If the new category needs data links, add a new `*_ASSETS`
   dict in `build_asset_bank.py` and a `stamp_link` call in
   `apply_links`.
7. Add the new category to `EXPECTED_CATEGORIES` in
   [scripts/audit_asset_links.py](../scripts/audit_asset_links.py).

## Troubleshooting

- **"Unmapped ChatGPT assets remain"** — the cleanup script
  refuses to commit. Open the file and add it to `DESCRIPTIVE_RENAMES`
  with the canonical final name.
- **"references missing asset"** — the data file points to an
  asset_id that is not in `data/assets.json`. Either the asset is
  not yet generated, or the spelling is wrong. The audit script
  is the friendlier reporter.
- **mature event must default blurred** — the validator catches
  any event with `mature: true` and a `presentation` other than
  `blurred`. Fix the JSON.
- **active reference to private model tooling** — the validator
  scans AGENTS.md, README.md, docs, ai/prompts, and web sources
  for forbidden terms tied to private generation tooling. Move
  the reference into private notes.
