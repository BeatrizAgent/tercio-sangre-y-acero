from __future__ import annotations

from comfyui_model_utils import EXAMPLE_MANIFEST_PATH, MANIFEST_PATH, get_comfyui_dir, load_manifest, target_path_for


def main() -> None:
    manifest_path = MANIFEST_PATH if MANIFEST_PATH.exists() else EXAMPLE_MANIFEST_PATH
    models = load_manifest(manifest_path)
    if not models and EXAMPLE_MANIFEST_PATH.exists():
        manifest_path = EXAMPLE_MANIFEST_PATH
        models = load_manifest(manifest_path)
        print("Starter manifest has no active entries yet; showing example pack.")
    comfyui_dir = get_comfyui_dir()

    print(f"Manifest: {manifest_path}")
    print(f"COMFYUI_DIR: {'set' if comfyui_dir else 'not set'}")
    print("")

    enabled = [model for model in models if model["enabled"]]
    disabled = [model for model in models if not model["enabled"]]
    print(f"Enabled models: {len(enabled)}")
    print(f"Disabled models: {len(disabled)}")
    print("")

    for model in models:
        status = "ENABLED" if model["enabled"] else "disabled"
        target = target_path_for(model, comfyui_dir) if comfyui_dir else f"$COMFYUI_DIR/models/{model['target_subdir']}"
        version = model.get("civitai_model_version_id") or "missing-version-id"
        print(f"- [{status}] {model['id']} :: {model['name']}")
        print(f"  provider={model['provider']} type={model['type']} base={model['base_model']} category={model['category']}")
        print(f"  target={target}")
        print(f"  version={version}")
        if model["enabled"] and not model.get("commercial_use_reviewed"):
            print("  warning=enabled but commercial_use_reviewed=false")
        if model["provider"] == "civitai" and model.get("source_url") and not model.get("civitai_model_version_id"):
            print("  warning=Civitai source URL present but version ID missing; downloader will not guess")


if __name__ == "__main__":
    main()
