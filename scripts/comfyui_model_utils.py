from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from email.message import Message
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "ai" / "models"
MANIFEST_PATH = MODEL_DIR / "model_manifest.json"
EXAMPLE_MANIFEST_PATH = MODEL_DIR / "model_manifest.example.json"
LOCK_PATH = MODEL_DIR / "downloaded_models.lock.json"
LICENSE_REVIEW_PATH = MODEL_DIR / "license_review.md"

ALLOWED_BASE_MODELS = {"SDXL", "SDXL 0.9", "SDXL 1.0", "SDXL Lightning", "Other"}
DISALLOWED_BASE_MODELS = {"Flux", "SD1.5", "Pony", "Illustrious"}
DANGEROUS_SCAN_RESULTS = {"danger", "error", "failed", "failure", "infected", "suspicious", "unsafe"}

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


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"Missing file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise SystemExit(f"{path} must contain a JSON object")
    return data


def load_manifest(path: Path = MANIFEST_PATH) -> list[dict[str, Any]]:
    data = load_json(path)
    models = data.get("models")
    if not isinstance(models, list):
        raise SystemExit(f"{path} must contain a top-level models array")
    for model in models:
        if not isinstance(model, dict):
            raise SystemExit(f"{path} contains a non-object model entry")
        missing = REQUIRED_FIELDS - set(model)
        if missing:
            raise SystemExit(f"Manifest entry {model.get('id', '<unknown>')} missing fields: {sorted(missing)}")
    return models


def load_lock() -> dict[str, Any]:
    if not LOCK_PATH.exists():
        return {"schema_version": 1, "models": []}
    data = load_json(LOCK_PATH)
    if not isinstance(data.get("models"), list):
        data["models"] = []
    return data


def save_lock(lock: dict[str, Any]) -> None:
    LOCK_PATH.write_text(json.dumps(lock, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def get_comfyui_dir() -> Path | None:
    value = os.environ.get("COMFYUI_DIR")
    return Path(value).expanduser() if value else None


def get_token() -> str | None:
    return os.environ.get("CIVITAI_API_TOKEN") or os.environ.get("CIVITAI_TOKEN")


def target_path_for(model: dict[str, Any], comfyui_dir: Path) -> Path:
    target_subdir = str(model["target_subdir"]).strip().replace("\\", "/")
    if target_subdir.startswith("/") or ".." in target_subdir.split("/"):
        raise ValueError(f"Unsafe target_subdir for {model['id']}: {target_subdir}")
    return comfyui_dir / "models" / target_subdir


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def filename_from_content_disposition(header: str | None) -> str | None:
    if not header:
        return None
    message = Message()
    message["content-disposition"] = header
    filename = message.get_filename()
    return Path(filename).name if filename else None


def is_true(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "yes", "1"}
    return bool(value)


def scan_is_safe(value: Any) -> bool:
    if not isinstance(value, str) or not value.strip():
        return False
    normalized = value.strip().lower()
    return normalized not in DANGEROUS_SCAN_RESULTS


def select_safe_civitai_file(metadata: dict[str, Any]) -> dict[str, Any]:
    files = metadata.get("files")
    if not isinstance(files, list) or not files:
        raise ValueError("metadata has no files")

    safe_files: list[dict[str, Any]] = []
    for file_row in files:
        if not isinstance(file_row, dict):
            continue
        name = str(file_row.get("name") or "")
        metadata_row = file_row.get("metadata") if isinstance(file_row.get("metadata"), dict) else {}
        file_format = str(file_row.get("format") or metadata_row.get("format") or "").lower()
        is_safetensors = name.lower().endswith(".safetensors") or "safetensor" in file_format
        if not is_safetensors:
            continue
        if not file_row.get("downloadUrl"):
            continue
        if not scan_is_safe(file_row.get("pickleScanResult")):
            continue
        if not scan_is_safe(file_row.get("virusScanResult")):
            continue
        safe_files.append(file_row)

    if not safe_files:
        raise ValueError("no safe .safetensors file with successful scans and downloadUrl")
    return safe_files[0]


def validate_civitai_metadata(model: dict[str, Any], metadata: dict[str, Any]) -> dict[str, Any]:
    model_info = metadata.get("model") if isinstance(metadata.get("model"), dict) else {}
    base_model = str(metadata.get("baseModel") or metadata.get("base_model") or model.get("base_model") or "")

    if model.get("base_model") in DISALLOWED_BASE_MODELS or base_model in DISALLOWED_BASE_MODELS:
        raise ValueError(f"base model not approved for first pack: {base_model or model.get('base_model')}")
    if base_model and base_model not in ALLOWED_BASE_MODELS:
        raise ValueError(f"base model not approved for first pack: {base_model}")

    nsfw = is_true(metadata.get("nsfw")) or is_true(model_info.get("nsfw"))
    if nsfw and not model.get("allow_nsfw"):
        raise ValueError("NSFW metadata rejected")

    poi = is_true(metadata.get("poi")) or is_true(model_info.get("poi"))
    if poi and not model.get("allow_poi"):
        raise ValueError("POI/person-likeness metadata rejected")

    selected_file = select_safe_civitai_file(metadata)
    return selected_file


def write_license_review(models: list[dict[str, Any]], lock: dict[str, Any]) -> None:
    if not models and EXAMPLE_MANIFEST_PATH.exists():
        models = load_manifest(EXAMPLE_MANIFEST_PATH)
    downloaded = {entry.get("id"): entry for entry in lock.get("models", []) if isinstance(entry, dict)}
    lines = [
        "# Model License Review",
        "",
        "Manual review required before enabling or using any model for project assets.",
        "",
        "| Model | Exact URL | Version ID | License copied manually | Commercial use allowed | Selling generations allowed | Merge allowed | No NSFW | No POI | No trademark/celebrity | Base model confirmed | Notes |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for model in models:
        locked = downloaded.get(model["id"], {})
        source_url = model.get("source_url") or locked.get("source_url") or ""
        version_id = model.get("civitai_model_version_id") or locked.get("version_id") or ""
        notes = model.get("license_notes") or ""
        lines.append(
            f"| {model['name']} | {source_url} | {version_id} | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | {notes} |"
        )
    LICENSE_REVIEW_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
