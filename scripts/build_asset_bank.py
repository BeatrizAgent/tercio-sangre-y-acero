from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
GPT_ASSETS = ROOT / "GPT-ASSETS"


CATEGORY_BY_DIR = {
    "armadura": "equipment",
    "armas": "weapon",
    "auxiliares": "support",
    "CG/cg_events": "scene",
    "CG/portraits": "portrait",
    "CG/sprites_events": "event_sprite",
    "enemigos/chusma": "enemy",
    "enemigos/franceses": "enemy",
    "enemigos/italianos": "enemy",
    "enemigos/moros": "enemy",
    "enemigos/protestantes": "enemy",
    "enemigos/turcos": "enemy",
    "epics": "scene",
    "icons-ui": "ui",
    "otros": "prop",
    "prota": "character",
    "prota/emociones": "character_emotion",
    "prota/sprites-animation": "character_sprite",
    "tercios": "character",
    "tercios/emociones": "character_emotion",
}

ITEM_ASSETS = {
    "rusty_pike": "arma_001",
    "chipped_sword": "arma_011",
    "worn_arquebus": "arma_021",
    "wet_powder_flask": "objeto_001",
    "cheap_morion": "morion_correia_cuero_simple",
    "dented_cuirass": "peto_abollado_bisono_impacto",
    "patched_doublet": "jubon_acolchado_gipon_crema",
    "old_boots": "armadura_024",
    "clean_bandage": "objeto_011",
    "wine_skin": "objeto_012",
    "hard_bread": "objeto_013",
    "doubtful_relic": "objeto_014",
    "captured_banner_fragment": "objeto_015",
}

ENEMY_ASSETS = {
    "hungry_deserters": "enemigo_chusma_001",
    "road_raiders": "enemigo_italiano_001",
    "enemy_skirmishers": "enemigo_frances_001",
}

MISSION_SCENES = {
    "night_watch_rain": "night_watch_rain_bg",
    "muddy_road_patrol": "muddy_road_patrol_bg",
    "powder_escort_front": "powder_escort_front_bg",
    "crossroads_skirmish": "muddy_road_patrol_bg",
    "bastion_assault": "powder_escort_front_bg",
}

EVENT_ASSETS = {
    "hunger_path": ("hunger_path_blurred", True),
    "dice_brawl": ("tavern_duel_bg", False),
    "caravan_encounter": ("muddy_road_patrol_bg", False),
    "equipment_broken": ("armory_bg", False),
    "stolen_baggage": ("stolen_baggage_blurred", True),
    "rotten_rations": ("rotten_rations_blurred", True),
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


def asset_id_for(path: Path) -> str:
    rel = path.relative_to(GPT_ASSETS)
    stem = path.stem
    if stem.startswith(("armadura_", "arma_", "auxiliar_", "enemigo_", "epica_", "icono_ui_", "objeto_", "tercio_")):
        return stem
    return stem


def usage_for(asset_id: str, rel_dir: str) -> list[str]:
    usage = []
    if rel_dir == "armadura" or rel_dir == "armas":
        usage.append("inventory")
    if rel_dir.startswith("enemigos"):
        usage.extend(["enemy", "mission"])
    if rel_dir == "epics":
        usage.extend(["mission", "event"])
    if rel_dir == "icons-ui":
        usage.append("ui")
    if rel_dir in {"tercios", "tercios/emociones"}:
        usage.extend(["portrait", "dialogue"])
    if rel_dir == "prota":
        usage.extend(["player", "portrait"])
    if rel_dir == "prota/emociones":
        usage.extend(["dialogue", "portrait"])
    if rel_dir == "prota/sprites-animation":
        usage.extend(["combat", "sprite"])
    if rel_dir == "CG/sprites_events":
        usage.extend(["event", "mission"])
    if rel_dir in {"otros", "auxiliares"}:
        usage.extend(["event", "inventory"])
    return sorted(set(usage or ["asset_bank"]))


def build_assets() -> list[dict[str, Any]]:
    assets = []
    for path in sorted(GPT_ASSETS.rglob("*.png")):
        if path.name.startswith("_"):
            continue
        rel = path.relative_to(GPT_ASSETS)
        rel_dir = rel.parent.as_posix()
        with Image.open(path) as image:
            rgba = image.convert("RGBA")
            transparent = rgba.getchannel("A").getextrema()[0] < 255
            dimensions = [image.width, image.height]
        asset_id = asset_id_for(path)
        assets.append(
            {
                "id": asset_id,
                "category": CATEGORY_BY_DIR.get(rel_dir, "asset"),
                "path": f"GPT-ASSETS/{rel.as_posix()}",
                "source": "chatgpt_manual",
                "dimensions": dimensions,
                "transparent": transparent,
                "usage": usage_for(asset_id, rel_dir),
                "mature": False,
                "presentation": "normal",
            }
        )
    return assets


def load_data(name: str) -> Any:
    return repair_mojibake(json.loads((DATA / name).read_text(encoding="utf-8")))


def write_json(name: str, payload: Any) -> None:
    (DATA / name).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def apply_links() -> None:
    items = load_data("items.json")
    for item in items:
        if item["id"] in ITEM_ASSETS:
            item["assetId"] = ITEM_ASSETS[item["id"]]
    write_json("items.json", items)

    enemies = load_data("enemies.json")
    for enemy in enemies:
        if enemy["id"] in ENEMY_ASSETS:
            enemy["portraitAssetId"] = ENEMY_ASSETS[enemy["id"]]
    write_json("enemies.json", enemies)

    missions = load_data("missions.json")
    for mission in missions:
        if mission["id"] in MISSION_SCENES:
            mission["sceneAssetId"] = MISSION_SCENES[mission["id"]]
    write_json("missions.json", missions)

    events = load_data("events.json")
    for event in events:
        asset_id, mature = EVENT_ASSETS.get(event["id"], ("epica_001", False))
        event["assetId"] = asset_id
        event["mature"] = mature
        event["presentation"] = "blurred" if mature else "normal"
    write_json("events.json", events)

    for name in ["loot_tables.json", "ranks.json", "report_fragments.json", "shops.json", "stats.json", "training.json", "wounds.json"]:
        path = DATA / name
        if path.exists():
            write_json(name, load_data(name))


def main() -> None:
    assets = build_assets()
    write_json("assets.json", assets)
    apply_links()
    print(json.dumps({"assets": len(assets), "data": "linked"}, indent=2))


if __name__ == "__main__":
    main()
