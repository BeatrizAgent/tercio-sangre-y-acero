# Recursos faltantes — Próxima ronda

Generado por `scripts/audit_asset_links.py`. No es un asset bank; es la lista de trabajo para el próximo lote de ChatGPT.

## Resumen

- Assets en banco: **442**
- Categorias presentes: **12**
- Referencias rotas: **0**
- Vinculos faltantes: **13**
- Cobertura: **94.2%**

## Categorias por planear

| Categoria | Actual | Objetivo | Restante | Prompt |
|---|---:|---:|---:|---|
| `sidebar_icon` | 0 | 8 | **8** | [ai/prompts/sidebar-icons.md](ai/prompts/sidebar-icons.md) |
| `resource_icon` | 0 | 10 | **10** | [ai/prompts/resource-status-icons.md](ai/prompts/resource-status-icons.md) |
| `action_icon` | 0 | 10 | **10** | [ai/prompts/action-icons.md](ai/prompts/action-icons.md) |
| `ui_frame` | 0 | 10 | **10** | [ai/prompts/ui-9-slice.md](ai/prompts/ui-9-slice.md) |
| `ornament` | 0 | 10 | **10** | [ai/prompts/ornaments.md](ai/prompts/ornaments.md) |
| `diego_sprite_base` | 3 | 7 | **4** | [ai/prompts/diego-sprites.md](ai/prompts/diego-sprites.md) |
| `enemy_sprite_base` | 0 | 6 | **6** | [ai/prompts/enemy-sprites.md](ai/prompts/enemy-sprites.md) |
| `screen_background` | 0 | 6 | **6** | [ai/prompts/screen-bg.md](ai/prompts/screen-bg.md) |
| `ui_texture` | 0 | 6 | **6** | [ai/prompts/textures.md](ai/prompts/textures.md) |
| `portrait_variant` | 0 | 9 | **9** | [ai/prompts/portrait-variants.md](ai/prompts/portrait-variants.md) |
| `event_scene` | 0 | 8 | **8** | [ai/prompts/event-scenes.md](ai/prompts/event-scenes.md) |

## Vinculos faltantes

| Archivo | Registro | Campo | Motivo |
|---|---|---|---|
| `shops` | `company_armory` | `portraitAssetId` | missing |
| `shops` | `flanders_merchant` | `portraitAssetId` | missing |
| `shops` | `old_smithy` | `portraitAssetId` | missing |
| `training` | `pike` | `assetId` | missing |
| `training` | `sword` | `assetId` | missing |
| `training` | `arquebus` | `assetId` | missing |
| `training` | `discipline` | `assetId` | missing |
| `training` | `vigor` | `assetId` | missing |
| `report_fragments` | `rain_open` | `assetId` | missing |
| `report_fragments` | `mud_open` | `assetId` | missing |
| `report_fragments` | `powder_open` | `assetId` | missing |
| `report_fragments` | `held_line` | `assetId` | missing |
| `report_fragments` | `line_wavered` | `assetId` | missing |

## Como cerrar el lote

1. Abrir el prompt de la categoria en `ai/prompts/` y ejecutar el lote en ChatGPT.
2. Guardar PNG resultantes en `GPT-ASSETS/<categoria>/` con fondo magenta.
3. `python scripts/process_gpt_assets.py --commit` (renombra y limpia).
4. `python scripts/build_asset_bank.py` (regenera `data/assets.json` y enlaces).
5. `python tests/validate_asset_bank.py` y `python scripts/audit_asset_links.py`.
