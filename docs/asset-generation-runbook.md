# Asset Generation Runbook

Use this when working in low-reasoning mode. Do one asset at a time unless user asks for a batch.

## Source Of Truth

- Queue: `data/asset_generation_manifest.json`
- Final project assets: `GPT-ASSETS/<folder>/<filename>`
- Generated bank: `data/assets.json`
- Web copy: `web/public/assets/gpt-bank/`

Do not place final project assets only under Codex generated-image folders. Move accepted PNGs into `GPT-ASSETS`.

## One-Asset Flow

1. Pick first asset where `status` is `queued`.
2. Generate one image with `image_gen` using:
   - `prompt`
   - `negativePrompt`
   - target use, size, mature flag, and transparency flag from manifest
3. For transparent assets, ask image model for flat magenta chroma-key background. Remove background with:

   ```powershell
   python "$env:CODEX_HOME\skills\.system\imagegen\scripts\remove_chroma_key.py" --input <source.png> --out <final.png> --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
   ```

4. Save final PNG to `GPT-ASSETS/<folder>/<filename>`.
5. Change that asset status to `accepted`.
6. Run:

   ```powershell
   python scripts/process_gpt_assets.py
   python scripts/build_asset_bank.py
   python scripts/validate_asset_generation_manifest.py
   node web/scripts/sync-data.mjs
   ```

7. If `data/assets.json` contains the asset ID, change status to `linked`.
8. For UI icon work, add the asset path to `uiIconPaths` in `web/src/lib/game-data.ts` before replacing a Lucide import.

## Mature SFW Rules

For `scenes/discharge` and any `_blurred` or `_obscured` filename:

- Must use `mature: true`.
- Must use `presentation: "blurred"` or `"obscured"`.
- Show consequence only: sealed document, returned gear, empty cot, closed door, crutch, coins, silhouettes.
- Do not show explicit sex, sexualized body, gore, exposed amputation, or child close-up.

## Replacement Order For Lucide

1. Generate and link all `wave_01_ui_lucide_replacement` assets.
2. Extend `uiIconPaths`.
3. Replace imports in pages/components with `UiAssetIcon`.
4. Remove `lucide-react` from `web/package.json` only after:

   ```powershell
   Get-ChildItem web\src -Recurse -Include *.tsx,*.ts | Select-String -Pattern 'lucide-react'
   ```

   returns no results.

## Validation

Run from repo root unless command says otherwise:

```powershell
python scripts/validate_asset_generation_manifest.py
python scripts/build_asset_bank.py
node web/scripts/sync-data.mjs
cd web
pnpm exec tsc --noEmit
pnpm lint
pnpm validate
```

If `python scripts/process_gpt_assets.py --commit` is used, confirm there are no unmapped ChatGPT filenames first. Prefer dry run without `--commit` while testing prompts.
