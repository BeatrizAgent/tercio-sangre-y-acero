from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
GPT_ASSETS = ROOT / "GPT-ASSETS"


CATEGORY_BY_DIR = {
    "armor": "equipment",
    "weapons": "weapon",
    "support": "support",
    "scenes/events": "scene",
    "portraits/npcs": "portrait",
    "portraits/story": "portrait",
    "portraits/variants": "portrait_variant",
    "scenes/backgrounds": "screen_background",
    "scenes/event-sprites": "event_sprite",
    "enemies/bandits": "enemy",
    "enemies/french": "enemy",
    "enemies/italian": "enemy",
    "enemies/moors": "enemy",
    "enemies/protestants": "enemy",
    "enemies/turks": "enemy",
    "enemies/sprites": "enemy_sprite_base",
    "scenes/mature": "scene",
    "ui/icons": "ui",
    "ui/game-icons": "ui",
    "ui/training": "training_icon",
    "ui/roles": "formation_role_icon",
    "ui/ordinances": "formation_ordinance_icon",
    "props": "prop",
    "props/food": "food",
    "scenes/city": "city_scene",
    "scenes/discharge": "discharge_scene",
    "missions/special/maps": "special_mission_map",
    "missions/special/scenes": "special_mission_scene",
    "missions/special/bosses": "special_mission_boss",
    "characters/diego": "character",
    "characters/diego/portraits": "character_emotion",
    "characters/diego/sprites": "character_sprite",
    "characters/diego/sprites-base": "character_sprite_base",
    "characters/companions": "character",
    "characters/companions/portraits": "character_emotion",
    "missions/combat-sprites": "combat_sprite",
    "ui/sidebar": "sidebar_icon",
    "ui/resource": "resource_icon",
    "ui/action": "action_icon",
    "ui/frames": "ui_frame",
    "ui/ornaments": "ornament",
    "ui/textures": "ui_texture",
    "portraits/bosses/flandes": "portrait",
    "portraits/bosses/francia": "portrait",
    "portraits/bosses/inglaterra": "portrait",
    "portraits/bosses/italia": "portrait",
    "portraits/enemies/north-africa": "portrait",
    "portraits/player-options": "portrait_variant",
    "portraits/player-options/epic": "portrait_variant_epic",
    "portraits/player-options/roles/arquebusiers": "portrait_role_variant",
    "portraits/player-options/roles/epic-officers": "portrait_role_variant_epic",
    "portraits/player-options/roles/guards": "portrait_role_variant",
    "portraits/player-options/roles/officers": "portrait_role_variant",
    "portraits/player-options/roles/pikemen": "portrait_role_variant",
    "portraits/player-options/roles/recruits": "portrait_role_variant",
    "portraits/player-options/roles/sailors": "portrait_role_variant",
    "portraits/player-options/roles/scouts": "portrait_role_variant",
    "portraits/player-options/roles/specialists": "portrait_role_variant",
    "portraits/player-options/roles/swordsmen": "portrait_role_variant",
    "portraits/player-options/roles/veterans": "portrait_role_variant",
}

# Backwards-compat aliases: when a stale folder slips through the audit
# still recognises it and tags the asset with the same category. New
# generations should never use these.
LEGACY_CATEGORY_BY_DIR = {
    "armadura": "equipment",
    "armas": "weapon",
    "auxiliares": "support",
    "CG/cg_events": "scene",
    "CG/portraits": "portrait",
    "CG/portrait_variants": "portrait_variant",
    "CG/screen_bg": "screen_background",
    "CG/sprites_events": "event_sprite",
    "enemigos/chusma": "enemy",
    "enemigos/franceses": "enemy",
    "enemigos/italianos": "enemy",
    "enemigos/moros": "enemy",
    "enemigos/protestantes": "enemy",
    "enemigos/turcos": "enemy",
    "enemigos/sprites": "enemy_sprite_base",
    "epics": "scene",
    "icons-ui": "ui",
    "otros": "prop",
    "prota": "character",
    "prota/emociones": "character_emotion",
    "prota/sprites-animation": "character_sprite",
    "prota/sprites-base": "character_sprite_base",
    "tercios": "character",
    "tercios/emociones": "character_emotion",
}

ITEM_ASSETS = {
    "rusty_pike": "weapon_pike_common_001",
    "chipped_sword": "weapon_pike_uncommon_011",
    "worn_arquebus": "weapon_arquebus_uncommon_021",
    "wet_powder_flask": "prop_polvora_humeda_001",
    "cheap_morion": "morion_correia_cuero_simple",
    "dented_cuirass": "peto_abollado_bisono_impacto",
    "patched_doublet": "jubon_acolchado_gipon_crema",
    "old_boots": "armor_cuirass_uncommon_024",
    "clean_bandage": "prop_moneda_de_plata_011",
    "wine_skin": "prop_carta_del_hogar_012",
    "hard_bread": "prop_aceite_de_armas_013",
    "doubtful_relic": "prop_piedra_de_mechero_014",
    "captured_banner_fragment": "prop_especias_de_italia_015",
}

ENEMY_ASSETS = {
    "hungry_deserters": "enemy_bandit_001",
    "road_raiders": "enemy_italian_001",
    "enemy_skirmishers": "enemy_french_001",
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

# Rank icons. The bank does not yet contain these; the audit script flags
# the gap and the user generates them via ai/prompts/sidebar-icons.md.
RANK_ASSETS = {
    "bisono": "icono_sidebar_cuartel",  # placeholder, will be replaced by rank badge
    "soldado": "icono_recurso_experiencia",
    "soldado_viejo": "icono_recurso_honor",
    "cabo_de_escuadra": "icono_recurso_honor",
    "sargento": "icono_recurso_honor",
    "alferez": "icono_recurso_honor",
    "capitan": "icono_recurso_honor",
}

# Training drill icons. Will be wired once the resource_icon batch lands.
TRAINING_ASSETS = {
    "pike": "icono_recurso_experiencia",
    "sword": "icono_recurso_experiencia",
    "arquebus": "icono_recurso_experiencia",
    "discipline": "icono_recurso_honor",
    "vigor": "icono_recurso_fatiga",
}

# Shopkeep portraits. Wired once the portrait_variant batch lands.
SHOP_ASSETS = {
    "company_armory": "retrato_armero_neutral",
    "flanders_merchant": "retrato_capellan_neutral",
    "old_smithy": "retrato_armero_neutral",
}

# Report fragment icons. Wired once the action_icon batch lands.
REPORT_FRAGMENT_ASSETS = {
    "rain_open": "icono_accion_leer_reporte",
    "mud_open": "icono_accion_leer_reporte",
    "powder_open": "icono_accion_leer_reporte",
    "held_line": "icono_accion_cobrar_recompensa",
    "line_wavered": "icono_accion_curar_herida",
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
    rel_dir = rel.parent.as_posix()
    if rel_dir.startswith("portraits/player-options/roles/"):
        role = rel_dir.split("/")[-1].replace("-", "_")
        return f"role_{role}_{stem.removeprefix('player_portrait_')}"
    if stem.startswith(("armadura_", "arma_", "auxiliar_", "enemigo_", "epica_", "icono_ui_", "objeto_", "tercio_")):
        return stem
    return stem


def usage_for(asset_id: str, rel_dir: str) -> list[str]:
    usage = []
    if rel_dir in {"armor", "weapons"}:
        usage.append("inventory")
    if rel_dir.startswith("enemies/"):
        usage.extend(["enemy", "mission"])
    if rel_dir == "scenes/mature":
        usage.extend(["mission", "event"])
    if rel_dir == "ui/icons":
        usage.append("ui")
    if rel_dir == "ui/game-icons":
        usage.extend(["ui", "game_icon"])
    if rel_dir in {"characters/companions", "characters/companions/portraits"}:
        usage.extend(["portrait", "dialogue"])
    if rel_dir == "characters/diego":
        usage.extend(["player", "portrait"])
    if rel_dir == "characters/diego/portraits":
        usage.extend(["dialogue", "portrait"])
    if rel_dir == "characters/diego/sprites":
        usage.extend(["combat", "sprite"])
    if rel_dir == "scenes/event-sprites":
        usage.extend(["event", "mission"])
    if rel_dir in {"props", "support"}:
        usage.extend(["event", "inventory"])
    if rel_dir == "props/food":
        usage.extend(["inventory", "food", "consumable"])
    if rel_dir == "scenes/city":
        usage.extend(["city", "background"])
    if rel_dir == "scenes/discharge":
        usage.extend(["event", "discharge", "mature"])
    if rel_dir.startswith("missions/special/"):
        usage.extend(["mission", "special_mission"])
        if rel_dir.endswith("/maps"):
            usage.append("map")
        if rel_dir.endswith("/scenes"):
            usage.append("scene")
        if rel_dir.endswith("/bosses"):
            usage.append("boss")
    if rel_dir == "ui/training":
        usage.extend(["training", "ui"])
    if rel_dir == "ui/roles":
        usage.extend(["company", "formation", "role", "ui"])
    if rel_dir == "ui/ordinances":
        usage.extend(["company", "formation", "ordinance", "ui"])
    if rel_dir.startswith("portraits/bosses/"):
        usage.append("campaign_boss")
    if rel_dir.startswith("portraits/enemies/"):
        usage.extend(["enemy", "portrait"])
    if rel_dir == "portraits/story":
        usage.extend(["story", "portrait", "dialogue"])
    if rel_dir == "portraits/player-options" or rel_dir.startswith("portraits/player-options/"):
        usage.append("player_portrait_selection")
        parts = rel_dir.split("/")
        if "roles" in parts:
            role_index = parts.index("roles") + 1
            if role_index < len(parts):
                usage.append(f"role:{parts[role_index]}")
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
        category = CATEGORY_BY_DIR.get(rel_dir) or LEGACY_CATEGORY_BY_DIR.get(rel_dir) or "asset"
        mature = rel_dir == "scenes/discharge" or path.stem.endswith("_blurred") or path.stem.endswith("_obscured")
        presentation = "blurred" if rel_dir == "scenes/discharge" or path.stem.endswith("_blurred") else "normal"
        assets.append(
            {
                "id": asset_id,
                "category": category,
                "path": f"GPT-ASSETS/{rel.as_posix()}",
                "source": "chatgpt_manual",
                "dimensions": dimensions,
                "transparent": transparent,
                "usage": usage_for(asset_id, rel_dir),
                "mature": mature,
                "presentation": presentation,
            }
        )
    return assets


def load_data(name: str) -> Any:
    return repair_mojibake(json.loads((DATA / name).read_text(encoding="utf-8")))


def load_optional_data(name: str) -> Any | None:
    path = DATA / name
    if not path.exists():
        return None
    return load_data(name)


def write_json(name: str, payload: Any) -> None:
    (DATA / name).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def stamp_link(records: list[dict[str, Any]], id_field: str, link_field: str, mapping: dict[str, str], asset_ids: set[str]) -> int:
    """Write ``link_field`` on each record whose id maps to a known asset.

    Returns the number of records stamped. Records whose target asset
    does not exist are left untouched so the audit can flag the gap.
    """
    stamped = 0
    for record in records:
        if not isinstance(record, dict):
            continue
        rec_id = record.get(id_field)
        if not rec_id or rec_id not in mapping:
            continue
        target = mapping[rec_id]
        if target in asset_ids:
            record[link_field] = target
            stamped += 1
    return stamped


def apply_links(asset_ids: set[str]) -> None:
    items = load_optional_data("items.json")
    if items is not None:
        for item in items:
            if item["id"] in ITEM_ASSETS:
                item["assetId"] = ITEM_ASSETS[item["id"]]
        write_json("items.json", items)

    enemies = load_optional_data("enemies.json")
    if enemies is not None:
        for enemy in enemies:
            if enemy["id"] in ENEMY_ASSETS:
                enemy["portraitAssetId"] = ENEMY_ASSETS[enemy["id"]]
        write_json("enemies.json", enemies)

    missions = load_optional_data("missions.json")
    if missions is not None:
        for mission in missions:
            if mission["id"] in MISSION_SCENES:
                mission["sceneAssetId"] = MISSION_SCENES[mission["id"]]
        write_json("missions.json", missions)

    events = load_optional_data("events.json")
    if events is not None:
        for event in events:
            asset_id, mature = EVENT_ASSETS.get(event["id"], ("loot_body_001", False))
            event["assetId"] = asset_id
            event["mature"] = mature
            event["presentation"] = "blurred" if mature else "normal"
        write_json("events.json", events)

    # New stamping tables. These only write the link when the target
    # asset already exists in the bank, so the script is a no-op until
    # the user generates the new waves. The audit script catches the gap.
    ranks = load_optional_data("ranks.json")
    if ranks is not None:
        stamp_link(ranks, "id", "iconAssetId", RANK_ASSETS, asset_ids)
        write_json("ranks.json", ranks)

    training = load_optional_data("training.json")
    if training is not None:
        stamp_link(training, "stat_id", "assetId", TRAINING_ASSETS, asset_ids)
        write_json("training.json", training)

    shops = load_optional_data("shops.json")
    if shops is not None:
        stamp_link(shops, "id", "portraitAssetId", SHOP_ASSETS, asset_ids)
        write_json("shops.json", shops)

    report_fragments = load_optional_data("report_fragments.json")
    if report_fragments is not None:
        stamp_link(report_fragments, "id", "assetId", REPORT_FRAGMENT_ASSETS, asset_ids)
        write_json("report_fragments.json", report_fragments)

    for name in ["loot_tables.json", "stats.json", "wounds.json"]:
        path = DATA / name
        if path.exists():
            write_json(name, load_data(name))


def main() -> None:
    assets = build_assets()
    write_json("assets.json", assets)
    asset_ids = {asset["id"] for asset in assets if "id" in asset}
    apply_links(asset_ids)
    print(json.dumps({"assets": len(assets), "data": "linked"}, indent=2))


if __name__ == "__main__":
    main()
