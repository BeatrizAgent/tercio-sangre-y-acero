from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
GPT_ASSETS = ROOT / "GPT-ASSETS"
WEB_GPT_ASSETS = ROOT / "web" / "public" / "assets" / "gpt-bank"

ACTIVE_TEXT_PATHS = [
    ROOT / "AGENTS.md",
    ROOT / "README.md",
    ROOT / "docs",
    ROOT / "ai" / "prompts",
    ROOT / "web" / "README.md",
    ROOT / "web" / "tests",
]

FORBIDDEN_ACTIVE_TERMS = [
    "ComfyUI",
    "Civitai",
    "COMFYUI_DIR",
    "checkpoint",
    "LoRA",
    "loras",
]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def iter_text_files(path: Path):
    if path.is_file():
        yield path
        return
    if not path.exists():
        return
    for child in path.rglob("*"):
        if child.is_file() and child.suffix.lower() in {".md", ".mjs", ".ts", ".tsx", ".py"}:
            yield child


def collect_asset_refs(value):
    refs: list[tuple[str, str]] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if key.endswith("AssetId") and isinstance(child, str):
                refs.append((key, child))
            refs.extend(collect_asset_refs(child))
    elif isinstance(value, list):
        for child in value:
            refs.extend(collect_asset_refs(child))
    return refs


def main() -> None:
    failures: list[str] = []

    assets_path = DATA / "assets.json"
    if not assets_path.exists():
        failures.append("missing data/assets.json")
        assets = []
    else:
        assets = load_json(assets_path)

    asset_ids = set()
    for asset in assets:
        asset_id = asset.get("id")
        if not asset_id:
            failures.append("asset missing id")
            continue
        if asset_id in asset_ids:
            failures.append(f"duplicate asset id: {asset_id}")
        asset_ids.add(asset_id)

        rel_path = asset.get("path")
        if not rel_path:
            failures.append(f"{asset_id} missing path")
        elif not (ROOT / rel_path).exists():
            failures.append(f"{asset_id} path missing: {rel_path}")
        else:
            public_path = WEB_GPT_ASSETS / Path(rel_path).relative_to("GPT-ASSETS")
            if not public_path.exists():
                failures.append(f"{asset_id} public mirror missing: {public_path.relative_to(ROOT)}")

        if asset.get("source") != "chatgpt_manual":
            failures.append(f"{asset_id} source must be chatgpt_manual")
        if asset.get("presentation") not in {"normal", "blurred", "obscured"}:
            failures.append(f"{asset_id} invalid presentation")
        if "mature" not in asset:
            failures.append(f"{asset_id} missing mature")
        if "dimensions" not in asset or len(asset.get("dimensions", [])) != 2:
            failures.append(f"{asset_id} missing dimensions")

    if len(assets) < 328:
        failures.append(f"expected at least 328 GPT assets, found {len(assets)}")

    for png in GPT_ASSETS.rglob("*.png"):
        if "ChatGPT Image" in png.name:
            failures.append(f"unrenamed GPT asset: {png.relative_to(ROOT)}")

    for data_file in ["items.json", "enemies.json", "events.json", "missions.json"]:
        path = DATA / data_file
        payload = load_json(path)
        for key, ref in collect_asset_refs(payload):
            if ref not in asset_ids:
                failures.append(f"{data_file} {key} references missing asset: {ref}")

    events = load_json(DATA / "events.json")
    for event in events:
        if event.get("mature") is True and event.get("presentation") != "blurred":
            failures.append(f"mature event must default blurred: {event.get('id')}")

    sync_script = (ROOT / "web" / "scripts" / "sync-data.mjs").read_text(encoding="utf-8")
    if '"assets.json"' not in sync_script:
        failures.append("web sync-data.mjs must sync assets.json")
    if "gpt-bank" not in sync_script:
        failures.append("web sync-data.mjs must mirror GPT-ASSETS into public assets")

    game_data = (ROOT / "web" / "src" / "lib" / "game-data.ts").read_text(encoding="utf-8")
    if "getAssetPublicPath" not in game_data:
        failures.append("game-data must expose getAssetPublicPath")

    event_page = (ROOT / "web" / "src" / "app" / "missions" / "[id]" / "page.tsx").read_text(encoding="utf-8")
    if "getAssetPublicPath" not in event_page or "presentation === \"blurred\"" not in event_page:
        failures.append("mission event UI must render asset and apply blurred presentation")

    for path in ACTIVE_TEXT_PATHS:
        for text_file in iter_text_files(path):
            if text_file.name == "validate_asset_bank.py":
                continue
            text = text_file.read_text(encoding="utf-8", errors="ignore")
            for term in FORBIDDEN_ACTIVE_TERMS:
                if term in text:
                    failures.append(f"active reference to {term}: {text_file.relative_to(ROOT)}")

    if failures:
        print(json.dumps({"ok": False, "failures": failures[:80], "failureCount": len(failures)}, indent=2))
        raise SystemExit(1)

    print(json.dumps({"ok": True, "assetCount": len(assets), "linkedAssetRefs": len(asset_ids)}, indent=2))


if __name__ == "__main__":
    main()
