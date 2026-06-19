#!/usr/bin/env python3
"""Audit asset links across the data bank.

Cross-references every JSON in ``data/`` against ``data/assets.json`` and
emits a machine-readable report plus a human-readable Markdown summary.

This script is read-only; it never edits data. It is the planning
companion of ``build_asset_bank.py`` and ``validate_asset_bank.py``.

Usage::

    python scripts/audit_asset_links.py            # writes reports, exits 0
    python scripts/audit_asset_links.py --strict   # exits 1 if any gap found
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
AUDIT_DIR = DATA / "_audit"
DESIGN = ROOT / "DESIGN"
MARKDOWN_OUT = DESIGN / "recursos-faltantes.next.md"
JSON_OUT = AUDIT_DIR / "asset_gap_report.json"


# Categories that the bank must grow into. Each entry tracks the data file
# and field that should carry the link once the asset exists.
EXPECTED_CATEGORIES: dict[str, dict[str, Any]] = {
    "sidebar_icon": {
        "description": "Sidebar navigation glyphs (8 total).",
        "prompt_file": "ai/prompts/sidebar-icons.md",
        "target_count": 8,
    },
    "resource_icon": {
        "description": "HUD resource and status glyphs (10 total).",
        "prompt_file": "ai/prompts/resource-status-icons.md",
        "target_count": 10,
    },
    "action_icon": {
        "description": "Action button glyphs (10 total).",
        "prompt_file": "ai/prompts/action-icons.md",
        "target_count": 10,
    },
    "ui_frame": {
        "description": "9-slice UI panels, nav, badges (10 total).",
        "prompt_file": "ai/prompts/ui-9-slice.md",
        "target_count": 10,
    },
    "ornament": {
        "description": "Corners, dividers, rivets, wax seal, banner (10 total).",
        "prompt_file": "ai/prompts/ornaments.md",
        "target_count": 10,
    },
    "diego_sprite_base": {
        "description": "Diego base animation frames (7).",
        "prompt_file": "ai/prompts/diego-sprites.md",
        "target_count": 7,
    },
    "enemy_sprite_base": {
        "description": "Enemy full-body idles (6 factions x 1).",
        "prompt_file": "ai/prompts/enemy-sprites.md",
        "target_count": 6,
    },
    "screen_background": {
        "description": "Wide screen backgrounds (6).",
        "prompt_file": "ai/prompts/screen-bg.md",
        "target_count": 6,
    },
    "ui_texture": {
        "description": "Tileable UI textures (6).",
        "prompt_file": "ai/prompts/textures.md",
        "target_count": 6,
    },
    "portrait_variant": {
        "description": "Diego + NPC emotion variants (9).",
        "prompt_file": "ai/prompts/portrait-variants.md",
        "target_count": 9,
    },
    "event_scene": {
        "description": "Indirect mature-SFW event scenes (8).",
        "prompt_file": "ai/prompts/event-scenes.md",
        "target_count": 8,
    },
}


def repair_mojibake(value: Any) -> Any:
    if isinstance(value, str) and ("Ã" in value or "Â" in value or "â" in value):
        try:
            return value.encode("latin1").decode("utf-8")
        except UnicodeError:
            return value
    if isinstance(value, list):
        return [repair_mojibake(item) for item in value]
    if isinstance(value, dict):
        return {key: repair_mojibake(child) for key, child in value.items()}
    return value


def load_json(path: Path) -> Any:
    return repair_mojibake(json.loads(path.read_text(encoding="utf-8")))


def collect_asset_refs(value: Any, path: str = "$") -> list[tuple[str, str, str]]:
    """Return ``(jsonpath, field, asset_id)`` tuples for every AssetId field."""
    refs: list[tuple[str, str, str]] = []
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = f"{path}.{key}"
            if key.endswith("AssetId") and isinstance(child, str) and child:
                refs.append((child_path, key, child))
            refs.extend(collect_asset_refs(child, child_path))
    elif isinstance(value, list):
        for idx, child in enumerate(value):
            refs.extend(collect_asset_refs(child, f"{path}[{idx}]"))
    return refs


def category_counts(assets: list[dict[str, Any]]) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for asset in assets:
        counts[asset.get("category", "unknown")] += 1
    return dict(sorted(counts.items()))


def gather_missing_for_field(
    records: list[dict[str, Any]],
    field: str,
    asset_ids: set[str],
) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for record in records:
        rec_id = record.get("id", "<no-id>")
        value = record.get(field)
        if not value:
            out.append({"id": rec_id, "field": field, "issue": "missing"})
        elif value not in asset_ids:
            out.append({"id": rec_id, "field": field, "issue": f"dangling:{value}"})
    return out


def gather_dangling_refs(
    payload: Any,
    asset_ids: set[str],
) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for jsonpath, field, value in collect_asset_refs(payload):
        if value not in asset_ids:
            out.append({"jsonpath": jsonpath, "field": field, "value": value})
    return out


def category_gap() -> dict[str, dict[str, Any]]:
    """Compare the new category targets against what the bank already has."""
    assets = load_json(DATA / "assets.json")
    counts: Counter[str] = Counter()
    for asset in assets:
        # Map folder-derived category to the EXPECTED_CATEGORIES keys.
        path = asset.get("path", "")
        if "/ui/" in path or path.startswith("GPT-ASSETS/ui/"):
            counts["ui_asset"] += 1
        if path.startswith("GPT-ASSETS/prota/sprites-base") or "diego_sprite" in asset.get("id", ""):
            counts["diego_sprite_base"] += 1
        if asset.get("category") in {"enemy"} and "idle" in asset.get("id", ""):
            counts["enemy_sprite_base"] += 1
    # The new categories are not yet wired into build_asset_bank.py; treat
    # them as 0 until the pipeline extension lands.
    planned = {key: 0 for key in EXPECTED_CATEGORIES}
    planned.update({k: v for k, v in counts.items() if k in planned})
    return {
        key: {
            "description": spec["description"],
            "prompt_file": spec["prompt_file"],
            "current": planned.get(key, 0),
            "target": spec["target_count"],
            "remaining": max(0, spec["target_count"] - planned.get(key, 0)),
        }
        for key, spec in EXPECTED_CATEGORIES.items()
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# Recursos faltantes — Próxima ronda")
    lines.append("")
    lines.append(
        "Generado por `scripts/audit_asset_links.py`. "
        "No es un asset bank; es la lista de trabajo para el próximo "
        "lote de ChatGPT."
    )
    lines.append("")

    summary = report["summary"]
    lines.append("## Resumen")
    lines.append("")
    lines.append(f"- Assets en banco: **{summary['asset_count']}**")
    lines.append(f"- Categorias presentes: **{summary['category_count']}**")
    lines.append(f"- Referencias rotas: **{summary['dangling_count']}**")
    lines.append(f"- Vinculos faltantes: **{summary['missing_count']}**")
    lines.append(f"- Cobertura: **{summary['coverage_pct']:.1f}%**")
    lines.append("")

    lines.append("## Categorias por planear")
    lines.append("")
    lines.append("| Categoria | Actual | Objetivo | Restante | Prompt |")
    lines.append("|---|---:|---:|---:|---|")
    for key, gap in report["category_gap"].items():
        lines.append(
            f"| `{key}` | {gap['current']} | {gap['target']} | "
            f"**{gap['remaining']}** | [{gap['prompt_file']}]({gap['prompt_file']}) |"
        )
    lines.append("")

    if report["dangling"]:
        lines.append("## Referencias rotas")
        lines.append("")
        lines.append("| Archivo | Campo | Valor |")
        lines.append("|---|---|---|")
        for entry in report["dangling"]:
            lines.append(
                f"| `{entry['file']}` | `{entry['field']}` | "
                f"`{entry['value']}` (en {entry['jsonpath']}) |"
            )
        lines.append("")

    if report["missing"]:
        lines.append("## Vinculos faltantes")
        lines.append("")
        lines.append("| Archivo | Registro | Campo | Motivo |")
        lines.append("|---|---|---|---|")
        for entry in report["missing"]:
            lines.append(
                f"| `{entry['file']}` | `{entry['id']}` | `{entry['field']}` | "
                f"{entry['issue']} |"
            )
        lines.append("")

    lines.append("## Como cerrar el lote")
    lines.append("")
    lines.append(
        "1. Abrir el prompt de la categoria en `ai/prompts/` y ejecutar el lote en ChatGPT."
    )
    lines.append(
        "2. Guardar PNG resultantes en `GPT-ASSETS/<categoria>/` con fondo magenta."
    )
    lines.append(
        "3. `python scripts/process_gpt_assets.py --commit` (renombra y limpia)."
    )
    lines.append(
        "4. `python scripts/build_asset_bank.py` (regenera `data/assets.json` y enlaces)."
    )
    lines.append(
        "5. `python tests/validate_asset_bank.py` y `python scripts/audit_asset_links.py`."
    )
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true", help="Exit 1 if any gap is found.")
    parser.add_argument("--quiet", action="store_true", help="Suppress stdout summary.")
    args = parser.parse_args()

    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    DESIGN.mkdir(parents=True, exist_ok=True)

    assets = load_json(DATA / "assets.json")
    asset_ids = {asset["id"] for asset in assets if "id" in asset}

    files: list[tuple[str, Path, str, str]] = [
        ("items", DATA / "items.json", "assetId", "id"),
        ("enemies", DATA / "enemies.json", "portraitAssetId", "id"),
        ("missions", DATA / "missions.json", "sceneAssetId", "id"),
        ("events", DATA / "events.json", "assetId", "id"),
        ("shops", DATA / "shops.json", "portraitAssetId", "id"),
        ("training", DATA / "training.json", "assetId", "stat_id"),
        ("report_fragments", DATA / "report_fragments.json", "assetId", "id"),
    ]

    missing: list[dict[str, str]] = []
    dangling: list[dict[str, str]] = []

    for label, path, primary_field, id_field in files:
        if not path.exists():
            dangling.append({"file": label, "field": "<file>", "value": path.name, "jsonpath": "$"})
            continue
        payload = load_json(path)
        if isinstance(payload, list):
            for record in payload:
                if not isinstance(record, dict):
                    continue
                rec_id = record.get(id_field) or record.get("id") or "<no-id>"
                value = record.get(primary_field)
                if not value:
                    missing.append({"file": label, "id": rec_id, "field": primary_field, "issue": "missing"})
                elif value not in asset_ids:
                    missing.append({"file": label, "id": rec_id, "field": primary_field, "issue": f"dangling:{value}"})
        for entry in gather_dangling_refs(payload, asset_ids):
            dangling.append(
                {
                    "file": label,
                    "field": entry["field"],
                    "value": entry["value"],
                    "jsonpath": entry["jsonpath"],
                }
            )

    coverage_total = 0
    coverage_have = 0
    for label, path, primary_field, _ in files:
        payload = load_json(path)
        if not isinstance(payload, list):
            continue
        for record in payload:
            if not isinstance(record, dict):
                continue
            coverage_total += 1
            if record.get(primary_field) in asset_ids:
                coverage_have += 1
    coverage_pct = (coverage_have / coverage_total * 100.0) if coverage_total else 100.0

    report = {
        "summary": {
            "asset_count": len(assets),
            "category_count": len(category_counts(assets)),
            "missing_count": len(missing),
            "dangling_count": len(dangling),
            "coverage_pct": coverage_pct,
        },
        "category_gap": category_gap(),
        "missing": missing,
        "dangling": dangling,
    }

    JSON_OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MARKDOWN_OUT.write_text(render_markdown(report), encoding="utf-8")

    if not args.quiet:
        print(json.dumps(report["summary"], indent=2))
        print(f"Report JSON : {JSON_OUT.relative_to(ROOT)}")
        print(f"Report MD   : {MARKDOWN_OUT.relative_to(ROOT)}")

    if args.strict and (missing or dangling):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
