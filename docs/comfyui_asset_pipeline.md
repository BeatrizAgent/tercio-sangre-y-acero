# ComfyUI Asset Pipeline

This repo stores only reproducible model metadata, prompts, and workflow notes. ComfyUI and model weights live outside the repo.

## Setup

1. Install ComfyUI outside this repo.
2. Set `COMFYUI_DIR` to the absolute ComfyUI folder.
3. Optional: set `CIVITAI_API_TOKEN` for gated Civitai downloads. `CIVITAI_TOKEN` is accepted as a local fallback.
4. Install Python dependency: `pip install -r requirements.txt`.
5. Copy reviewed entries from `ai/models/model_manifest.example.json` into `ai/models/model_manifest.json`.
6. Fill exact `civitai_model_version_id` values.
7. Review license terms manually in `ai/models/license_review.md`.
8. Enable only one or a few reviewed entries.
9. Run `python scripts/download_civitai_models.py --dry-run`.
10. Run `python scripts/download_civitai_models.py --download`.
11. Open ComfyUI and confirm models appear in the expected model folders.

## Placement

Manifest `target_subdir` maps under `$COMFYUI_DIR/models/`.

Examples:

- `checkpoints` -> `$COMFYUI_DIR/models/checkpoints/`
- `loras/tercios_equipment` -> `$COMFYUI_DIR/models/loras/tercios_equipment/`
- `vae` -> `$COMFYUI_DIR/models/vae/`
- `upscale_models` -> `$COMFYUI_DIR/models/upscale_models/`

## Safety Rules

Only SDXL models are approved for the first pack. Skip Pony, Illustrious, SD1.5, Flux, anime, celebrity, POI, NSFW, fetish, modern military, pickle, suspicious scan results, and unclear commercial permissions unless explicitly approved later.

The downloader rejects unsafe metadata by default and never marks commercial use as reviewed automatically.
