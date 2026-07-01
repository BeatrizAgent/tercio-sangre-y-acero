from __future__ import annotations

import json
from pathlib import Path
from typing import Any, cast

from flask import current_app

from .schemas import CatalogCounts, CatalogPayload, CharacterNamesPayload, JsonObject


def _data_dir() -> Path:
    return Path(str(current_app.config["TERCIO_DATA_DIR"]))


def _read_json(filename: str) -> dict[str, Any]:
    path = _data_dir() / filename
    with path.open(encoding="utf-8") as file:
        return cast(dict[str, Any], json.load(file))


def _object_list(raw: dict[str, Any], key: str) -> list[JsonObject]:
    value = raw.get(key, [])
    if not isinstance(value, list):
        return []
    return [cast(JsonObject, item) for item in value if isinstance(item, dict)]


def get_catalog_payload() -> CatalogPayload:
    raw = _read_json("catalog.json")
    return CatalogPayload(
        source="catalog-json",
        assets=_object_list(raw, "assets"),
        items=_object_list(raw, "items"),
        enemies=_object_list(raw, "enemies"),
        ranks=_object_list(raw, "ranks"),
        missions=_object_list(raw, "missions"),
        wounds=_object_list(raw, "wounds"),
        events=_object_list(raw, "events"),
        training=_object_list(raw, "training"),
        characters=_object_list(raw, "characters"),
        lootTables=_object_list(raw, "lootTables"),
        reportFragments=_object_list(raw, "reportFragments"),
    )


def get_catalog_counts() -> CatalogCounts:
    catalog = get_catalog_payload()
    return CatalogCounts(
        source=catalog.source,
        assets=len(catalog.assets),
        items=len(catalog.items),
        enemies=len(catalog.enemies),
        ranks=len(catalog.ranks),
        missions=len(catalog.missions),
        wounds=len(catalog.wounds),
        events=len(catalog.events),
        training=len(catalog.training),
        characters=len(catalog.characters),
        lootTables=len(catalog.lootTables),
        reportFragments=len(catalog.reportFragments),
    )


def get_character_names_payload() -> CharacterNamesPayload:
    return CharacterNamesPayload.model_validate(_read_json("character-names.json"))
