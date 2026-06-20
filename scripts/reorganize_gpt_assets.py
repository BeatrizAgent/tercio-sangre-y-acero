#!/usr/bin/env python3
"""Reorganize GPT-ASSETS into the English taxonomy.

Phase 1: build the rename plan and detect duplicate content.
Phase 2 (--apply): execute the moves, leave stems untouched so assetIds
in ``data/`` and ``web/`` keep working.

Folder map (Spanish -> English):

    armadura/                    -> armor/
    armas/                       -> weapons/
    auxiliares/                  -> support/
    enemigos/chusma/             -> enemies/bandits/
    enemigos/franceses/          -> enemies/french/
    enemigos/italianos/          -> enemies/italian/
    enemigos/moros/              -> enemies/moors/
    enemigos/protestantes/       -> enemies/protestants/
    enemigos/turcos/             -> enemies/turks/
    epics/                       -> scenes/mature/
    otros/                       -> props/
    prota/                       -> characters/diego/
    prota/emociones/             -> characters/diego/portraits/
    prota/sprites-animation/     -> characters/diego/sprites/
    tercios/                     -> characters/companions/
    tercios/emociones/           -> characters/companions/portraits/
    icons-ui/                    -> ui/icons/
    CG/cg_events/                -> scenes/events/
    CG/portraits/                -> portraits/npcs/
    CG/sprites_events/           -> scenes/event-sprites/

Duplicate (exact SHA256) PNGs are moved to ``archive/review/_duplicates``
with a manifest. Suspect near-duplicates (same stem, different folder)
are listed for human review.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "GPT-ASSETS"
ARCHIVE_REVIEW = SRC / "archive" / "review" / "_duplicates"
PLAN_OUT = ROOT / "data" / "_audit" / "asset_reorg_plan.json"


# (old_rel_dir, new_rel_dir)
FOLDER_MAP: dict[str, str] = {
    "armadura": "armor",
    "armas": "weapons",
    "auxiliares": "support",
    "enemigos/chusma": "enemies/bandits",
    "enemigos/franceses": "enemies/french",
    "enemigos/italianos": "enemies/italian",
    "enemigos/moros": "enemies/moors",
    "enemigos/protestantes": "enemies/protestants",
    "enemigos/turcos": "enemies/turks",
    "epics": "scenes/mature",
    "otros": "props",
    "prota": "characters/diego",
    "prota/emociones": "characters/diego/portraits",
    "prota/sprites-animation": "characters/diego/sprites",
    "tercios": "characters/companions",
    "tercios/emociones": "characters/companions/portraits",
    "icons-ui": "ui/icons",
    "CG/cg_events": "scenes/events",
    "CG/portraits": "portraits/npcs",
    "CG/sprites_events": "scenes/event-sprites",
}

TARGET_DIRS = set(FOLDER_MAP.values()) | {
    "archive/review",
    "armor",
    "characters/companions",
    "characters/companions/portraits",
    "characters/diego",
    "characters/diego/portraits",
    "characters/diego/sprites",
    "enemies/bandits",
    "enemies/french",
    "enemies/italian",
    "enemies/moors",
    "enemies/protestants",
    "enemies/turks",
    "portraits/bosses/flandes",
    "portraits/bosses/francia",
    "portraits/bosses/inglaterra",
    "portraits/bosses/italia",
    "portraits/enemies/north-africa",
    "portraits/npcs",
    "portraits/player-options",
    "portraits/player-options/epic",
    "portraits/player-options/roles/arquebusiers",
    "portraits/player-options/roles/epic-officers",
    "portraits/player-options/roles/guards",
    "portraits/player-options/roles/officers",
    "portraits/player-options/roles/pikemen",
    "portraits/player-options/roles/recruits",
    "portraits/player-options/roles/sailors",
    "portraits/player-options/roles/scouts",
    "portraits/player-options/roles/specialists",
    "portraits/player-options/roles/swordsmen",
    "portraits/player-options/roles/veterans",
    "props",
    "scenes/event-sprites",
    "scenes/events",
    "scenes/mature",
    "support",
    "ui/icons",
    "ui/roles",
    "ui/ordinances",
    "ui/training",
    "weapons",
}


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def rel_dir(path: Path) -> str:
    return path.parent.relative_to(SRC).as_posix()


def build_plan() -> dict:
    plan: dict = {
        "moves": [],          # (old_rel, new_rel, reason)
        "duplicates": [],     # SHA -> [paths]
        "by_stem": defaultdict(list),  # stem -> [paths]
        "unmapped_dirs": [],
        "summary": {},
    }
    by_hash: dict[str, list[str]] = defaultdict(list)
    by_stem: dict[str, list[str]] = defaultdict(list)

    for png in sorted(SRC.rglob("*.png")):
        if not png.is_file():
            continue
        if any(part.startswith("_") for part in png.relative_to(SRC).parts):
            continue
        if any(part.startswith("archive") for part in png.relative_to(SRC).parts):
            continue
        rel = png.relative_to(SRC).as_posix()
        stem = png.stem
        rd = rel_dir(png)
        by_stem[stem].append(rel)

        if rd in FOLDER_MAP:
            new_dir = FOLDER_MAP[rd]
            new_rel = f"{new_dir}/{png.name}"
            if new_rel != rel:
                plan["moves"].append(
                    {"old": rel, "new": new_rel, "reason": "folder_taxonomy"}
                )
        elif rd not in TARGET_DIRS:
            plan["unmapped_dirs"].append(rd)

        h = sha256_of(png)
        by_hash[h].append(rel)

    plan["by_stem"] = dict(by_stem)
    plan["duplicates"] = {h: ps for h, ps in by_hash.items() if len(ps) > 1}

    plan["summary"] = {
        "total_png": sum(len(v) for v in by_stem.values()),
        "unique_stem": len(by_stem),
        "duplicates_groups": len(plan["duplicates"]),
        "duplicate_files": sum(len(v) for v in plan["duplicates"].values()),
        "moves": len(plan["moves"]),
        "unmapped_dirs": sorted(set(plan["unmapped_dirs"])),
    }
    return plan


def print_plan(plan: dict) -> None:
    s = plan["summary"]
    print("=" * 70)
    print("ASSET REORGANIZATION PLAN")
    print("=" * 70)
    print(f"Total PNGs          : {s['total_png']}")
    print(f"Unique stems        : {s['unique_stem']}")
    print(f"Duplicate groups    : {s['duplicates_groups']} "
          f"({s['duplicate_files']} files in groups)")
    print(f"Planned moves       : {s['moves']}")
    print(f"Unmapped dirs       : {s['unmapped_dirs'] or 'none'}")
    print()

    print("FOLDER MAP")
    for old, new in FOLDER_MAP.items():
        print(f"  {old:30s} -> {new}")
    print()

    print("MOVES (first 10)")
    for m in plan["moves"][:10]:
        print(f"  {m['old']:55s} -> {m['new']}")
    if len(plan["moves"]) > 10:
        print(f"  ... and {len(plan['moves']) - 10} more")
    print()

    print("DUPLICATE GROUPS (exact SHA256, first 5)")
    for h, paths in list(plan["duplicates"].items())[:5]:
        print(f"  {h[:16]}  ({len(paths)} copies)")
        for p in paths:
            print(f"    - {p}")
    if len(plan["duplicates"]) > 5:
        print(f"  ... and {len(plan['duplicates']) - 5} more groups")
    print()


def apply_plan(plan: dict, *, dry_run: bool) -> None:
    moved = 0
    ARCHIVE_REVIEW.mkdir(parents=True, exist_ok=True)

    # 1) Folder moves
    for m in plan["moves"]:
        old = SRC / m["old"]
        new = SRC / m["new"]
        if not old.exists():
            print(f"  SKIP (missing): {m['old']}")
            continue
        if new.exists():
            print(f"  SKIP (target exists): {m['new']}")
            continue
        if dry_run:
            print(f"  DRY  {m['old']:55s} -> {m['new']}")
        else:
            new.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(old), str(new))
            moved += 1

    # 2) Duplicates: keep first occurrence by sorted path, move others to archive.
    archive_log = []
    for h, paths in plan["duplicates"].items():
        paths_sorted = sorted(paths)
        keeper = paths_sorted[0]
        duplicates = paths_sorted[1:]
        for dup in duplicates:
            new_loc = ARCHIVE_REVIEW / Path(dup).name
            # If a name collision already exists in archive, suffix it.
            n = 1
            target = new_loc
            while target.exists():
                target = ARCHIVE_REVIEW / f"{Path(dup).stem}__{n:02d}.png"
                n += 1
            old = SRC / dup
            if not old.exists():
                continue
            archive_log.append(
                {
                    "sha256": h,
                    "kept": keeper,
                    "moved": dup,
                    "archive_to": str(target.relative_to(SRC)),
                }
            )
            if dry_run:
                print(f"  DRY  DUP {dup} -> archive/{target.name}")
            else:
                shutil.move(str(old), str(target))
                moved += 1

    # 3) Suspect near-duplicates: same stem in different folders.
    suspect = []
    for stem, paths in plan["by_stem"].items():
        if len(paths) > 1:
            # Ignore paths that all share the same parent.
            parents = {Path(p).parent.as_posix() for p in paths}
            if len(parents) > 1:
                suspect.append({"stem": stem, "paths": paths})

    print()
    print("=" * 70)
    print(f"{'DRY-RUN' if dry_run else 'APPLIED'}: {moved} file moves executed")
    if not dry_run:
        (ROOT / "data" / "_audit").mkdir(parents=True, exist_ok=True)
        (ROOT / "data" / "_audit" / "duplicates_moved.json").write_text(
            json.dumps(archive_log, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        (ROOT / "data" / "_audit" / "near_duplicates.json").write_text(
            json.dumps(suspect, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote archive log: data/_audit/duplicates_moved.json")
        print(f"Wrote near-dup suspects: data/_audit/near_duplicates.json "
              f"({len(suspect)} groups)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true",
                        help="Actually move files (default: plan only).")
    parser.add_argument("--write-plan", action="store_true",
                        help="Write the plan JSON to data/_audit/.")
    args = parser.parse_args()

    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}")

    plan = build_plan()
    print_plan(plan)

    if args.write_plan:
        PLAN_OUT.parent.mkdir(parents=True, exist_ok=True)
        PLAN_OUT.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n",
                            encoding="utf-8")
        print(f"Plan written: {PLAN_OUT.relative_to(ROOT)}")

    if args.apply:
        print("=" * 70)
        print("APPLYING MOVES")
        print("=" * 70)
        apply_plan(plan, dry_run=False)
    elif "--apply" in sys.argv or args.apply:
        pass
    else:
        print("(dry-run) Re-run with --apply to execute moves.")
        print("(dry-run) Re-run with --write-plan to save plan JSON.")


if __name__ == "__main__":
    main()
