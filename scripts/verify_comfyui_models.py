from __future__ import annotations

import sys

from comfyui_model_utils import (
    ALLOWED_BASE_MODELS,
    DISALLOWED_BASE_MODELS,
    get_comfyui_dir,
    load_lock,
    load_manifest,
    target_path_for,
)


def main() -> None:
    models = load_manifest()
    lock = load_lock()
    comfyui_dir = get_comfyui_dir()
    errors: list[str] = []
    warnings: list[str] = []

    if comfyui_dir is None:
        errors.append("COMFYUI_DIR is not set")
    elif not comfyui_dir.exists():
        errors.append(f"COMFYUI_DIR does not exist: {comfyui_dir}")

    if comfyui_dir and comfyui_dir.exists():
        for model in models:
            if model["base_model"] in DISALLOWED_BASE_MODELS:
                warnings.append(f"{model['id']}: {model['base_model']} is blocked for first pack")
            elif model["base_model"] not in ALLOWED_BASE_MODELS:
                warnings.append(f"{model['id']}: unusual base model {model['base_model']}")

            try:
                target_dir = target_path_for(model, comfyui_dir)
            except ValueError as exc:
                errors.append(str(exc))
                continue
            if model["enabled"] and not target_dir.exists():
                errors.append(f"{model['id']}: target folder missing: {target_dir}")
            elif not target_dir.exists():
                warnings.append(f"{model['id']}: target folder not present yet: {target_dir}")

    locked_rows = [row for row in lock.get("models", []) if isinstance(row, dict)]
    for row in locked_rows:
        local_path = row.get("local_path")
        if not local_path:
            errors.append(f"{row.get('id', '<unknown>')}: lock entry missing local_path")
            continue
        from pathlib import Path

        path = Path(local_path)
        if not path.exists():
            errors.append(f"{row.get('id', '<unknown>')}: locked file missing: {path}")
        elif not path.name.lower().endswith(".safetensors"):
            errors.append(f"{row.get('id', '<unknown>')}: locked file is not safetensors: {path}")

    enabled = [model for model in models if model["enabled"]]
    print("ComfyUI model verification")
    print(f"COMFYUI_DIR: {comfyui_dir or 'not set'}")
    print(f"Manifest entries: {len(models)}")
    print(f"Enabled entries: {len(enabled)}")
    print(f"Downloaded lock entries: {len(locked_rows)}")
    print("")

    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")
        print("")

    if errors:
        print("Errors:")
        for error in errors:
            print(f"- {error}")
        sys.exit(1)

    print("Verification passed.")


if __name__ == "__main__":
    main()
