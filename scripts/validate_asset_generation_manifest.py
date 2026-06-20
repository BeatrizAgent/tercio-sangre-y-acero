from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "asset_generation_manifest.json"
GPT_ASSETS = ROOT / "GPT-ASSETS"
ASSET_BANK = ROOT / "data" / "assets.json"

VALID_STATUS = {"queued", "generated", "accepted", "rejected", "linked"}
VALID_PRESENTATION = {"normal", "blurred", "obscured"}
REQUIRED_FIELDS = {
    "id",
    "wave",
    "assetId",
    "category",
    "usage",
    "folder",
    "filename",
    "size",
    "transparent",
    "mature",
    "presentation",
    "prompt",
    "negativePrompt",
    "status",
}
KNOWN_FOLDERS = {
    "ui/game-icons",
    "props/food",
    "scenes/city",
    "scenes/discharge",
    "missions/special/maps",
    "missions/special/scenes",
    "missions/special/bosses",
}
MATURE_FOLDERS = {"scenes/discharge"}
REQUIRES_EXISTING_FILE = {"accepted", "linked"}


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"Missing file: {path}")
    except json.JSONDecodeError as exc:
        fail(f"Invalid JSON in {path}: {exc}")


def asset_alpha_ok(path: Path) -> bool:
    with Image.open(path) as image:
        if image.mode != "RGBA":
            image = image.convert("RGBA")
        alpha = image.getchannel("A")
        return alpha.getextrema()[0] < 255


def validate_manifest(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    if manifest.get("version") != 1:
        fail("Manifest version must be 1")
    assets = manifest.get("assets")
    if not isinstance(assets, list) or not assets:
        fail("Manifest must contain non-empty assets list")

    ids = Counter()
    asset_ids = Counter()
    filenames = Counter()

    for index, asset in enumerate(assets):
        if not isinstance(asset, dict):
            fail(f"Asset at index {index} must be an object")
        missing = REQUIRED_FIELDS - set(asset)
        if missing:
            fail(f"{asset.get('id', index)} missing fields: {sorted(missing)}")

        ids[asset["id"]] += 1
        asset_ids[asset["assetId"]] += 1
        rel_path = f"{asset['folder']}/{asset['filename']}"
        filenames[rel_path] += 1

        if asset["status"] not in VALID_STATUS:
            fail(f"{asset['id']} has invalid status {asset['status']}")
        if asset["presentation"] not in VALID_PRESENTATION:
            fail(f"{asset['id']} has invalid presentation {asset['presentation']}")
        if asset["folder"] not in KNOWN_FOLDERS:
            fail(f"{asset['id']} uses unmapped folder {asset['folder']}")
        if not str(asset["filename"]).endswith(".png"):
            fail(f"{asset['id']} filename must end in .png")
        if asset["filename"] != Path(asset["filename"]).name:
            fail(f"{asset['id']} filename must not contain directories")
        if not isinstance(asset["usage"], list) or not asset["usage"]:
            fail(f"{asset['id']} usage must be non-empty list")
        if not isinstance(asset["size"], list) or len(asset["size"]) != 2:
            fail(f"{asset['id']} size must be [width, height]")
        if not all(isinstance(value, int) and value > 0 for value in asset["size"]):
            fail(f"{asset['id']} size values must be positive integers")
        if not isinstance(asset["prompt"], str) or len(asset["prompt"].strip()) < 40:
            fail(f"{asset['id']} prompt is too short")
        if not isinstance(asset["negativePrompt"], str) or len(asset["negativePrompt"].strip()) < 20:
            fail(f"{asset['id']} negativePrompt is too short")

        expected_mature = asset["folder"] in MATURE_FOLDERS or asset["filename"].endswith(("_blurred.png", "_obscured.png"))
        if expected_mature and not asset["mature"]:
            fail(f"{asset['id']} must be mature=true")
        if expected_mature and asset["presentation"] == "normal":
            fail(f"{asset['id']} mature asset must use blurred or obscured presentation")

        path = GPT_ASSETS / asset["folder"] / asset["filename"]
        if asset["status"] in REQUIRES_EXISTING_FILE and not path.exists():
            fail(f"{asset['id']} is {asset['status']} but file is missing: {path}")
        if path.exists():
            with Image.open(path) as image:
                if image.width < min(asset["size"][0], 512) or image.height < min(asset["size"][1], 512):
                    fail(f"{asset['id']} image too small: {image.size}")
            if asset["transparent"] and not asset_alpha_ok(path):
                fail(f"{asset['id']} requires transparency but has no alpha: {path}")

    duplicate_ids = [key for key, count in ids.items() if count > 1]
    duplicate_asset_ids = [key for key, count in asset_ids.items() if count > 1]
    duplicate_files = [key for key, count in filenames.items() if count > 1]
    if duplicate_ids:
        fail(f"Duplicate manifest ids: {duplicate_ids}")
    if duplicate_asset_ids:
        fail(f"Duplicate assetIds: {duplicate_asset_ids}")
    if duplicate_files:
        fail(f"Duplicate output filenames: {duplicate_files}")
    return assets


def validate_asset_bank_links(assets: list[dict[str, Any]]) -> None:
    if not ASSET_BANK.exists():
        return
    bank = load_json(ASSET_BANK)
    if not isinstance(bank, list):
        fail("data/assets.json must be a list")
    bank_ids = {entry.get("id") for entry in bank if isinstance(entry, dict)}
    for asset in assets:
        if asset["status"] == "linked" and asset["assetId"] not in bank_ids:
            fail(f"{asset['id']} is linked but {asset['assetId']} is absent from data/assets.json")


def main() -> None:
    manifest = load_json(MANIFEST)
    assets = validate_manifest(manifest)
    validate_asset_bank_links(assets)
    print(json.dumps({"assets": len(assets), "manifest": "valid"}, indent=2))


if __name__ == "__main__":
    main()
