from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from urllib.parse import urlparse

try:
    import requests
except ImportError as exc:
    raise SystemExit("Missing dependency: requests. Run `pip install -r requirements.txt`.") from exc

from comfyui_model_utils import (
    LOCK_PATH,
    get_comfyui_dir,
    get_token,
    load_lock,
    load_manifest,
    now_iso,
    filename_from_content_disposition,
    sha256_file,
    target_path_for,
    validate_civitai_metadata,
    write_license_review,
    save_lock,
)


CIVITAI_VERSION_URL = "https://civitai.com/api/v1/model-versions/{version_id}"


def fetch_civitai_metadata(version_id: str, token: str | None) -> dict:
    headers = {"User-Agent": "tercio-model-manager/1.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.get(CIVITAI_VERSION_URL.format(version_id=version_id), headers=headers, timeout=45)
    response.raise_for_status()
    return response.json()


def resolve_filename(response: requests.Response, fallback: str) -> str:
    header_name = filename_from_content_disposition(response.headers.get("content-disposition"))
    if header_name:
        return header_name
    parsed_name = Path(urlparse(response.url).path).name
    return parsed_name or fallback


def download_file(url: str, destination_dir: Path, expected_filename: str, expected_sha256: str, token: str | None) -> dict:
    destination_dir.mkdir(parents=True, exist_ok=True)
    headers = {"User-Agent": "tercio-model-manager/1.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    with requests.get(url, headers=headers, stream=True, allow_redirects=True, timeout=60) as response:
        response.raise_for_status()
        filename = expected_filename or resolve_filename(response, "model.safetensors")
        if not filename.lower().endswith(".safetensors"):
            raise ValueError(f"refusing non-safetensors download filename: {filename}")
        destination = destination_dir / filename

        if destination.exists():
            existing_sha = sha256_file(destination)
            if expected_sha256 and existing_sha.lower() != expected_sha256.lower():
                raise ValueError(f"existing file hash mismatch: {destination}")
            return {
                "path": destination,
                "filename": filename,
                "size": destination.stat().st_size,
                "sha256": existing_sha,
                "skipped": True,
            }

        temp_path = destination.with_suffix(destination.suffix + ".part")
        with temp_path.open("wb") as handle:
            shutil.copyfileobj(response.raw, handle)
        actual_sha = sha256_file(temp_path)
        if expected_sha256 and actual_sha.lower() != expected_sha256.lower():
            temp_path.unlink(missing_ok=True)
            raise ValueError(f"downloaded hash mismatch for {filename}")
        temp_path.replace(destination)
        return {
            "path": destination,
            "filename": filename,
            "size": destination.stat().st_size,
            "sha256": actual_sha,
            "skipped": False,
        }


def upsert_lock_entry(lock: dict, entry: dict) -> None:
    rows = [row for row in lock.get("models", []) if isinstance(row, dict) and row.get("id") != entry["id"]]
    rows.append(entry)
    lock["models"] = sorted(rows, key=lambda row: row["id"])


def process_model(model: dict, comfyui_dir: Path | None, token: str | None, download: bool) -> tuple[str, dict | None]:
    if not model["enabled"]:
        return f"skip disabled: {model['id']}", None

    if model["provider"] != "civitai":
        return f"manual review/download required: {model['id']} provider={model['provider']}", None

    if not model.get("civitai_model_version_id"):
        if model.get("source_url") and "civitai.com" in model["source_url"]:
            return f"warning: {model['id']} has Civitai URL but no civitai_model_version_id; not guessing", None
        return f"warning: {model['id']} missing civitai_model_version_id", None

    metadata = fetch_civitai_metadata(str(model["civitai_model_version_id"]), token)
    selected_file = validate_civitai_metadata(model, metadata)
    trained_words = metadata.get("trainedWords") if isinstance(metadata.get("trainedWords"), list) else []
    download_url = selected_file["downloadUrl"]
    target_dir_text = f"$COMFYUI_DIR/models/{model['target_subdir']}"

    if not download:
        return f"dry-run ok: {model['id']} -> {target_dir_text}", None

    if comfyui_dir is None:
        raise ValueError("COMFYUI_DIR is required for --download")

    target_dir = target_path_for(model, comfyui_dir)
    result = download_file(
        download_url,
        target_dir,
        str(model.get("expected_filename") or selected_file.get("name") or ""),
        str(model.get("sha256") or ""),
        token,
    )
    lock_entry = {
        "id": model["id"],
        "name": model["name"],
        "provider": model["provider"],
        "version_id": model["civitai_model_version_id"],
        "source_url": model.get("source_url", ""),
        "local_path": str(result["path"]),
        "filename": result["filename"],
        "file_size": result["size"],
        "sha256": result["sha256"],
        "downloaded_at": now_iso(),
        "trigger_words": model.get("trigger_words") or trained_words,
        "base_model": model["base_model"],
        "category": model["category"],
        "license_notes": model.get("license_notes", ""),
    }
    action = "exists" if result["skipped"] else "downloaded"
    return f"{action}: {model['id']} -> {result['path']}", lock_entry


def main() -> None:
    parser = argparse.ArgumentParser(description="Safely dry-run or download reviewed Civitai models for ComfyUI.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Validate enabled entries without writing model files.")
    mode.add_argument("--download", action="store_true", help="Download enabled reviewed entries.")
    args = parser.parse_args()
    download = bool(args.download)

    models = load_manifest()
    lock = load_lock()
    comfyui_dir = get_comfyui_dir()
    token = get_token()

    print(f"Mode: {'download' if download else 'dry-run'}")
    print(f"COMFYUI_DIR: {'set' if comfyui_dir else 'not set'}")
    print(f"Civitai token: {'set' if token else 'not set'}")
    print("")

    errors: list[str] = []
    for model in models:
        try:
            message, lock_entry = process_model(model, comfyui_dir, token, download)
            print(message)
            if lock_entry:
                upsert_lock_entry(lock, lock_entry)
        except Exception as exc:
            errors.append(f"{model.get('id', '<unknown>')}: {exc}")
            print(f"error: {model.get('id', '<unknown>')}: {exc}")

    if download:
        save_lock(lock)
    write_license_review(models, lock)
    print(f"\nLock file: {LOCK_PATH}")

    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
