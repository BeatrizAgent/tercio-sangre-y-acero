from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_PATHS = [
    "ai/models/model_manifest.json",
    "ai/models/model_manifest.example.json",
    "ai/models/downloaded_models.lock.json",
    "ai/models/license_review.md",
    "ai/models/model_notes.md",
    "ai/prompts/portraits.md",
    "ai/prompts/icons.md",
    "ai/prompts/scenes.md",
    "ai/prompts/ui_mockups.md",
    "ai/prompts/sprites.md",
    "ai/workflows/README.md",
    "ai/references/README.md",
    "scripts/download_civitai_models.py",
    "scripts/verify_comfyui_models.py",
    "scripts/print_model_plan.py",
    "docs/comfyui_asset_pipeline.md",
    "docs/model_downloads.md",
    ".gitignore",
]

REQUIRED_FIELDS = {
    "id",
    "name",
    "provider",
    "civitai_model_id",
    "civitai_model_version_id",
    "source_url",
    "type",
    "base_model",
    "category",
    "target_subdir",
    "trigger_words",
    "recommended_weight",
    "license_notes",
    "commercial_use_reviewed",
    "allow_nsfw",
    "allow_poi",
    "expected_filename",
    "sha256",
    "enabled",
}

MODEL_IGNORE_RULES = [
    "*.safetensors",
    "*.ckpt",
    "*.pt",
    "*.pth",
    "*.bin",
    "*.gguf",
    "*.onnx",
    "*.vae.pt",
    "*.vae.safetensors",
    "/ai/downloads/",
    "/models/",
]


def fail(message: str) -> None:
    raise AssertionError(message)


def main() -> None:
    missing = [path for path in REQUIRED_PATHS if not (ROOT / path).exists()]
    if missing:
        fail(f"Missing required paths: {missing}")

    example = json.loads((ROOT / "ai/models/model_manifest.example.json").read_text(encoding="utf-8"))
    entries = example.get("models")
    if not isinstance(entries, list):
        fail("model_manifest.example.json must contain a top-level models array")
    if len(entries) != 18:
        fail(f"Expected 18 example model entries, found {len(entries)}")

    for entry in entries:
        missing_fields = REQUIRED_FIELDS - set(entry)
        if missing_fields:
            fail(f"{entry.get('id', '<unknown>')} missing fields: {sorted(missing_fields)}")
        if entry["enabled"] is not False:
            fail(f"{entry['id']} must default enabled=false")
        if entry["allow_nsfw"] is not False:
            fail(f"{entry['id']} must default allow_nsfw=false")
        if entry["allow_poi"] is not False:
            fail(f"{entry['id']} must default allow_poi=false")
        if entry["base_model"] not in {"SDXL", "Other"}:
            fail(f"{entry['id']} first pack must stay SDXL/Other only")

    active = json.loads((ROOT / "ai/models/model_manifest.json").read_text(encoding="utf-8"))
    active_entries = active.get("models")
    if not isinstance(active_entries, list):
        fail("model_manifest.json must contain a top-level models array")

    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    for rule in MODEL_IGNORE_RULES:
        if rule not in gitignore:
            fail(f".gitignore missing model rule: {rule}")

    for script_name in [
        "scripts/download_civitai_models.py",
        "scripts/verify_comfyui_models.py",
        "scripts/print_model_plan.py",
    ]:
        compile((ROOT / script_name).read_text(encoding="utf-8"), script_name, "exec")

    print("ComfyUI manager validation passed.")


if __name__ == "__main__":
    main()
