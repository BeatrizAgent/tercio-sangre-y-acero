#!/usr/bin/env python3
"""Rename GPT-ASSETS file stems to descriptive slugs in phases.

Idempotent: re-running is a no-op once a phase is complete.
Driven by `data/items.json` (and `data/enemies.json`) so the slugs come
from the gameplay metadata, not from a guess.

Slug conventions:

    weapons/   weapon_{type}_{rarity}_{nnn}.png          (arma_001-070)
    armor/     armor_{type}_{rarity}_{nnn}.png            (armadura_001-053)
               keep already-descriptive names
    props/     prop_{slug_from_name}.png                  (objeto_001-020)
    scenes/mature/  loot_{type}_{nnn}.png                 (epica_001-020)
    support/   support_aux_{nnn}.png                      (auxiliar_001-010)
    enemies/{faction}/  enemy_{faction}_{nnn}.png
    characters/companions/  companion_v_{nnn}.png
    characters/companions/portraits/  companion_portrait_v_{nnn}.png
    ui/icons/  ui_icon_v_{nnn}.png                        (icono_ui_001-029)

Side effects per rename:
- data/items.json, data/enemies.json, data/events.json, data/...
  assetId / portraitAssetId / sceneAssetId fields are rewritten.
- web/src/**/*.ts(x) / .css  hardcoded paths are rewritten.
- data/assets.json is NOT touched here; build_asset_bank.py regenerates it.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "GPT-ASSETS"
DATA = ROOT / "data"
WEB_SRC = ROOT / "web" / "src"

ENEMY_FACTION_MAP = {
    "bandits": "bandit",
    "french": "french",
    "italian": "italian",
    "moors": "moor",
    "protestants": "protestant",
    "turks": "turk",
}


def load_json(path: Path) -> list:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def slugify_ascii(value: str) -> str:
    repl = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
        "ü": "u", "ñ": "n",
    }
    for old, new in repl.items():
        value = value.replace(old, new)
    value = re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_").lower()
    return value


def prop_slug(name: str, asset_id: str) -> str:
    """Turn a trade_good name into a clean prop slug."""
    # Strip leading punctuation / numbering.
    base = re.sub(r"^[\s\W]+", "", name)
    s = slugify_ascii(base)
    # Pad with the assetId's trailing number to keep it unique.
    m = re.search(r"(\d+)$", asset_id)
    suffix = m.group(1) if m else ""
    return f"prop_{s}_{suffix}" if s else f"prop_{suffix}"


# ---------- Phase implementations ----------

def phase_weapons(plan_only: bool) -> dict[str, str]:
    """Rename arma_NNN -> weapon_{type}_{rarity}_{NNN}."""
    items = load_json(DATA / "items.json")
    rename: dict[str, str] = {}
    for item in items:
        aid = item.get("assetId", "")
        if not aid.startswith("arma_"):
            continue
        item_type = item.get("type", "weapon")
        rarity = item.get("rarity", "common")
        nnn = aid.split("_", 1)[1]
        new_id = f"weapon_{item_type}_{rarity}_{nnn}"
        if new_id != aid:
            rename[aid] = new_id
    return _apply_renames(rename, "weapons", plan_only)


def phase_armor(plan_only: bool) -> dict[str, str]:
    """Rename armadura_NNN -> armor_{type}_{rarity}_{NNN}.

    Already-descriptive armor files keep their stem.
    """
    items = load_json(DATA / "items.json")
    rename: dict[str, str] = {}
    for item in items:
        aid = item.get("assetId", "")
        if not aid.startswith("armadura_"):
            continue
        item_type = item.get("type", "armor")
        rarity = item.get("rarity", "common")
        nnn = aid.split("_", 1)[1]
        new_id = f"armor_{item_type}_{rarity}_{nnn}"
        if new_id != aid:
            rename[aid] = new_id
    return _apply_renames(rename, "armor", plan_only)


def phase_props(plan_only: bool) -> dict[str, str]:
    items = load_json(DATA / "items.json")
    rename: dict[str, str] = {}
    for item in items:
        aid = item.get("assetId", "")
        if not aid.startswith("objeto_"):
            continue
        new_id = prop_slug(item.get("name", ""), aid)
        if new_id != aid:
            rename[aid] = new_id
    return _apply_renames(rename, "props", plan_only)


def phase_mature(plan_only: bool) -> dict[str, str]:
    items = load_json(DATA / "items.json")
    rename: dict[str, str] = {}
    for item in items:
        aid = item.get("assetId", "")
        if not aid.startswith("epica_"):
            continue
        # legendary_body_001 -> body; legendary_main_hand_005 -> main_hand
        item_id = item.get("id", "")
        m = re.match(r"^legendary_([a-z_]+)_\d+$", item_id)
        slot = m.group(1) if m else "loot"
        nnn = aid.split("_", 1)[1]
        new_id = f"loot_{slot}_{nnn}"
        if new_id != aid:
            rename[aid] = new_id
    return _apply_renames(rename, "scenes/mature", plan_only)


def phase_support(plan_only: bool) -> dict[str, str]:
    """auxiliar_NNN -> support_aux_NNN. No data references."""
    rename: dict[str, str] = {}
    for png in sorted((SRC / "support").glob("*.png")):
        stem = png.stem
        m = re.match(r"^auxiliar_(\d+)$", stem)
        if not m:
            continue
        new_id = f"support_aux_{m.group(1)}"
        rename[stem] = new_id
    return _apply_renames(rename, "support", plan_only)


def phase_enemies(plan_only: bool) -> dict[str, str]:
    """enemigo_{faction}_NNN -> enemy_{faction_singular}_NNN."""
    rename: dict[str, str] = {}
    enemies_dir = SRC / "enemies"
    if not enemies_dir.exists():
        return rename
    for faction_dir in sorted(enemies_dir.iterdir()):
        if not faction_dir.is_dir():
            continue
        faction = faction_dir.name  # bandits, french, ...
        singular = ENEMY_FACTION_MAP.get(faction, faction.rstrip("s"))
        for png in sorted(faction_dir.glob("*.png")):
            stem = png.stem
            m = re.match(r"^enemigo_([a-z]+)_(\d+)$", stem)
            if not m:
                continue
            nnn = m.group(2)
            new_id = f"enemy_{singular}_{nnn}"
            rename[stem] = new_id
    return _apply_renames(rename, "enemies", plan_only)


def phase_companions(plan_only: bool) -> dict[str, str]:
    """tercio_NNN -> companion_v_NNN; tercio_emocion_NNN -> companion_portrait_v_NNN."""
    rename: dict[str, str] = {}
    comp_dir = SRC / "characters" / "companions"
    if comp_dir.exists():
        for png in sorted(comp_dir.glob("*.png")):
            stem = png.stem
            m = re.match(r"^tercio_(\d+)$", stem)
            if m:
                rename[stem] = f"companion_v_{m.group(1)}"
    port_dir = comp_dir / "portraits" if comp_dir.exists() else None
    if port_dir and port_dir.exists():
        for png in sorted(port_dir.glob("*.png")):
            stem = png.stem
            m = re.match(r"^tercio_emocion_(\d+)$", stem)
            if m:
                rename[stem] = f"companion_portrait_v_{m.group(1)}"
    return _apply_renames(rename, "characters/companions", plan_only)


def phase_ui_generic(plan_only: bool) -> dict[str, str]:
    """icono_ui_NNN -> ui_icon_v_NNN. Unreferenced, but uniform for hygiene."""
    rename: dict[str, str] = {}
    icons_dir = SRC / "ui" / "icons"
    if not icons_dir.exists():
        return rename
    for png in sorted(icons_dir.glob("*.png")):
        stem = png.stem
        m = re.match(r"^icono_ui_(\d+)$", stem)
        if m:
            rename[stem] = f"ui_icon_v_{m.group(1).zfill(2)}"
    return _apply_renames(rename, "ui/icons", plan_only)


# ---------- Core apply ----------

def _apply_renames(
    rename_map: dict[str, str],
    folder_label: str,
    plan_only: bool,
) -> dict[str, str]:
    """Apply renames in GPT-ASSETS, propagate to data/*.json and web/src.

    The rename_map keys are old assetId stems; values are new stems.
    Files are moved within their parent folder; no folder change.
    """
    if not rename_map:
        print(f"[{folder_label}] nothing to rename.")
        return {}

    # 1) Rename files.
    moved = 0
    collisions: list[str] = []
    for old, new in rename_map.items():
        for png in SRC.rglob(f"{old}.png"):
            target = png.with_name(f"{new}.png")
            if target.exists() and target != png:
                collisions.append(f"{target.relative_to(SRC)}")
                continue
            if not plan_only:
                shutil.move(str(png), str(target))
                moved += 1

    # 2) Update data/*.json: replace "oldId" with "newId" inside string fields.
    data_files = [
        DATA / "items.json",
        DATA / "enemies.json",
        DATA / "missions.json",
        DATA / "events.json",
        DATA / "shops.json",
        DATA / "training.json",
        DATA / "report_fragments.json",
        DATA / "ranks.json",
        DATA / "loot_tables.json",
        DATA / "wounds.json",
        DATA / "stats.json",
        DATA / "characters.json",
    ]
    rewrites_data = 0
    for path in data_files:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        original = text
        for old, new in rename_map.items():
            # Replace inside string values only; quote-aware to avoid
            # partial matches like "armor_001" matching inside "armor_0010".
            text = re.sub(
                rf'"{re.escape(old)}"',
                f'"{new}"',
                text,
            )
        if text != original and not plan_only:
            path.write_text(text, encoding="utf-8")
            rewrites_data += text.count('"') - original.count('"')

    # 3) Update web/src hardcoded paths that contain the old id as a stem.
    rewrites_web = 0
    for src_file in WEB_SRC.rglob("*"):
        if not src_file.is_file():
            continue
        if src_file.suffix not in {".ts", ".tsx", ".css", ".js", ".mjs"}:
            continue
        try:
            text = src_file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        original = text
        for old, new in rename_map.items():
            # Match the old stem as a path component followed by .png
            text = re.sub(
                rf"/{re.escape(old)}\.png",
                f"/{new}.png",
                text,
            )
        if text != original and not plan_only:
            src_file.write_text(text, encoding="utf-8")
            rewrites_web += 1

    # 4) web/data/json mirror (will be re-synced later, but update now too).
    mirror = ROOT / "web" / "data" / "json" / "assets.json"
    if mirror.exists():
        text = mirror.read_text(encoding="utf-8")
        original = text
        for old, new in rename_map.items():
            text = re.sub(
                rf'"{re.escape(old)}"',
                f'"{new}"',
                text,
            )
            text = re.sub(
                rf"/{re.escape(old)}\.png",
                f"/{new}.png",
                text,
            )
        if text != original and not plan_only:
            mirror.write_text(text, encoding="utf-8")

    # 5) build_asset_bank.py: update the hardcoded assetId maps so future
    #    asset links (rusty_pike -> arma_001 etc.) keep pointing at the
    #    new ids.
    bank_path = ROOT / "scripts" / "build_asset_bank.py"
    if bank_path.exists():
        text = bank_path.read_text(encoding="utf-8")
        original = text
        # Match `"<old>"` in value position (after a colon, possibly with
        # a space). The maps use bare string values.
        for old, new in rename_map.items():
            text = re.sub(
                rf'"{re.escape(old)}"',
                f'"{new}"',
                text,
            )
        if text != original and not plan_only:
            bank_path.write_text(text, encoding="utf-8")

    print(
        f"[{folder_label}] "
        f"renames={len(rename_map)} files_moved={moved} "
        f"data_files_updated={sum(1 for p in data_files if p.exists() and (not plan_only))} "
        f"web_files_updated={rewrites_web} "
        f"collisions={len(collisions)}"
    )
    if collisions:
        for c in collisions[:5]:
            print(f"  collision: {c}")
    return rename_map


PHASES = {
    "weapons": phase_weapons,
    "armor": phase_armor,
    "props": phase_props,
    "mature": phase_mature,
    "support": phase_support,
    "enemies": phase_enemies,
    "companions": phase_companions,
    "ui_generic": phase_ui_generic,
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--phase",
        choices=list(PHASES.keys()) + ["all"],
        default="all",
    )
    parser.add_argument(
        "--plan",
        action="store_true",
        help="Print what would change without writing.",
    )
    args = parser.parse_args()

    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}")

    selected = list(PHASES.keys()) if args.phase == "all" else [args.phase]
    for name in selected:
        PHASES[name](args.plan)


if __name__ == "__main__":
    main()
