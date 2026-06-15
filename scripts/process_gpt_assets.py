from __future__ import annotations

import argparse
import json
import re
import shutil
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "GPT-ASSETS"
DEFAULT_BACKUP_ROOT = ROOT / "output"


PREFIXES = {
    "armadura": "armadura",
    "armas": "arma",
    "auxiliares": "auxiliar",
    "CG/sprites_events": "evento_sprite",
    "enemigos/chusma": "enemigo_chusma",
    "enemigos/franceses": "enemigo_frances",
    "enemigos/italianos": "enemigo_italiano",
    "enemigos/moros": "enemigo_moro",
    "enemigos/protestantes": "enemigo_protestante",
    "enemigos/turcos": "enemigo_turco",
    "epics": "epica",
    "icons-ui": "icono_ui",
    "otros": "objeto",
    "prota": "diego",
    "prota/emociones": "diego_emocion",
    "prota/sprites-animation": "diego_sprite",
    "tercios": "tercio",
    "tercios/emociones": "tercio_emocion",
}


CHATGPT_RE = re.compile(r"^chatgpt image\b", re.IGNORECASE)

DESCRIPTIVE_RENAMES = {
    "CG/sprites_events/ChatGPT Image 15 jun 2026, 17_54_05 (1).png": "tercio_lluvia_con_estandarte.png",
    "CG/sprites_events/ChatGPT Image 15 jun 2026, 17_54_05 (2).png": "cirujano_atendiendo_herido.png",
    "CG/sprites_events/ChatGPT Image 15 jun 2026, 17_54_06 (3).png": "soldado_arrodillado_ante_ensenia.png",
    "CG/sprites_events/ChatGPT Image 15 jun 2026, 17_54_06 (4).png": "soldados_jugando_dados_mesa.png",
    "CG/sprites_events/ChatGPT Image 15 jun 2026, 17_54_06 (5).png": "rifa_cadaveres_campamento.png",
    "CG/sprites_events/ChatGPT Image 15 jun 2026, 17_54_06 (6).png": "entierro_campamento_humo.png",
    "CG/sprites_events/ChatGPT Image 15 jun 2026, 17_54_07 (7).png": "discusion_oficiales_pertrechos.png",
    "CG/sprites_events/ChatGPT Image 15 jun 2026, 17_54_07 (8).png": "taberna_soldados_mesa.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_40 (1).png": "espada_martillo_cruzados.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_40 (2).png": "medalla_cruz_roja_bronce.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_40 (3).png": "sol_dorado_cara.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_41 (4).png": "calavera_medallon.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_41 (5).png": "bolsa_monedas_pequena.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_41 (6).png": "venda_lino_enrollada.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_41 (7).png": "botella_vidrio_verde.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_42 (8).png": "condecoracion_estrella_laurel.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_42 (9).png": "escudo_partido_cruz_roja.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_50_42 (10).png": "medallon_calavera_oscuro.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_24 (1).png": "bolsa_monedas_cruz.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_25 (2).png": "saquito_monedas_documento.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_25 (3).png": "peto_morion_dorado.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_26 (4).png": "morion_peto_correas.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_26 (5).png": "orden_sellada_daga.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_27 (6).png": "camastro_manta_lana.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_27 (7).png": "vendas_tarros_medicina.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_28 (8).png": "pergamino_pluma_sello.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_29 (9).png": "bolsa_monedas_medalla.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 16_58_31 (10).png": "casco_cuero_monedas.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_03_42 (1).png": "espada_martillo_yunque.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_03_42 (2).png": "morion_flecha_engranaje.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_03_43 (3).png": "morion_peto_martillo.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_03_43 (4).png": "candado_bronce.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_03_43 (5).png": "reloj_arena_bronce.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_03_43 (6).png": "flecha_circular_laurel.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_04 (1).png": "marco_panel_negro_ancho.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_04 (2).png": "marco_panel_negro_claveteado.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_04 (3).png": "barra_panel_negra_estrecha.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_05 (4).png": "barra_panel_roja_larga.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_07 (5).png": "barra_panel_marron_larga.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_07 (6).png": "barra_panel_roja_remaches.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_07 (7).png": "marco_panel_cuadrado_negro.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_07 (8).png": "marco_panel_vertical_negro.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_08 (9).png": "barra_panel_negra_ornamento.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_10_08 (10).png": "barra_panel_negra_dorada.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_27 (1).png": "esquina_marco_dorada_superior_izquierda.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_28 (2).png": "esquina_marco_dorada_superior_derecha.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_28 (3).png": "esquina_marco_dorada_inferior_izquierda.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_28 (4).png": "esquina_marco_dorada_inferior_derecha.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_28 (5).png": "divisor_dorado_horizontal.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_29 (6).png": "ornamento_dorado_horizontal.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_29 (7).png": "broquel_acero_redondo.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_29 (8).png": "broquel_dorado_redondo.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_29 (9).png": "estandarte_cruz_roja_colgante.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_16_30 (10).png": "sello_lacre_cruz_roja.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_28_10 (1).png": "textura_madera_oscura.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_28_11 (2).png": "textura_metal_oscuro_remaches.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_28_11 (3).png": "textura_cuero_marron.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_28_12 (4).png": "textura_pergamino_envejecido.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_28_12 (5).png": "humo_negro_transparente.png",
    "icons-ui/ChatGPT Image 15 jun 2026, 17_28_12 (6).png": "salpicadura_barro_transparente.png",
    "prota/ChatGPT Image 15 jun 2026, 17_35_28 (1).png": "diego_piquero_frontal_descanso.png",
    "prota/ChatGPT Image 15 jun 2026, 17_35_28 (2).png": "diego_piquero_frontal_firme.png",
    "prota/ChatGPT Image 15 jun 2026, 17_35_29 (3).png": "diego_piquero_tres_cuartos.png",
    "prota/ChatGPT Image 15 jun 2026, 17_35_29 (4).png": "diego_arrodillado_con_pica.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_03 (1).png": "diego_retrato_serio.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_03 (2).png": "diego_retrato_brazos_cruzados.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_03 (3).png": "diego_retrato_neutral.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_03 (4).png": "diego_retrato_cansado.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_05 (5).png": "campesino_miserable_retrato.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_06 (6).png": "mozo_con_jarrilla_retrato.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_06 (7).png": "diego_senalando_acusador.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_07 (8).png": "capellan_libro_retrato.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_08 (9).png": "diego_cuerpo_entero_pica.png",
    "prota/emociones/ChatGPT Image 15 jun 2026, 17_47_08 (10).png": "diego_cuerpo_entero_firme.png",
    "prota/sprites-animation/ChatGPT Image 15 jun 2026, 17_43_02 (1).png": "diego_sprite_caminar.png",
    "prota/sprites-animation/ChatGPT Image 15 jun 2026, 17_43_02 (2).png": "diego_sprite_ataque_pica.png",
    "prota/sprites-animation/ChatGPT Image 15 jun 2026, 17_43_02 (3).png": "diego_sprite_golpe_espada.png",
}


def iter_pngs(root: Path) -> list[Path]:
    return sorted(
        p
        for p in root.rglob("*.png")
        if p.is_file()
        and not any(part.startswith("_") for part in p.relative_to(root).parts)
    )


def slugify(value: str) -> str:
    value = value.lower()
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "ñ": "n",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = re.sub(r"_+", "_", value).strip("_")
    return value or "asset"


def dir_key(path: Path, root: Path) -> str:
    return path.parent.relative_to(root).as_posix()


def output_name(path: Path, root: Path, counters: dict[str, int], used: set[str]) -> str:
    rel_source = path.relative_to(root).as_posix()
    if rel_source in DESCRIPTIVE_RENAMES:
        candidate = DESCRIPTIVE_RENAMES[rel_source]
        if candidate not in used:
            used.add(candidate)
            return candidate

    key = dir_key(path, root)
    prefix = PREFIXES.get(key, slugify(key.replace("/", "_")))
    stem = slugify(path.stem)

    if CHATGPT_RE.match(stem) or stem.startswith("chatgpt_image"):
        counters[prefix] += 1
        candidate = f"{prefix}_{counters[prefix]:03d}.png"
    else:
        candidate = f"{stem}.png"

    if candidate not in used:
        used.add(candidate)
        return candidate

    base = candidate[:-4]
    n = 2
    while f"{base}_{n:02d}.png" in used:
        n += 1
    candidate = f"{base}_{n:02d}.png"
    used.add(candidate)
    return candidate


def border_pixels(rgb: np.ndarray) -> np.ndarray:
    top = rgb[0, :, :]
    bottom = rgb[-1, :, :]
    left = rgb[:, 0, :]
    right = rgb[:, -1, :]
    return np.concatenate([top, bottom, left, right], axis=0)


def estimate_background(rgb: np.ndarray) -> np.ndarray:
    border = border_pixels(rgb)
    quantized = (border // 8) * 8
    packed = (
        quantized[:, 0].astype(np.int32) << 16
        | quantized[:, 1].astype(np.int32) << 8
        | quantized[:, 2].astype(np.int32)
    )
    color = np.bincount(packed).argmax()
    return np.array([(color >> 16) & 255, (color >> 8) & 255, color & 255], dtype=np.float32)


def has_magenta_border(image: Image.Image) -> bool:
    rgb = np.array(image.convert("RGB"), dtype=np.uint8)
    border = border_pixels(rgb)
    red = border[:, 0].astype(np.int16)
    green = border[:, 1].astype(np.int16)
    blue = border[:, 2].astype(np.int16)
    magenta = (red >= 180) & (blue >= 180) & (green <= 120) & (np.abs(red - blue) <= 90)
    return float(magenta.mean()) >= 0.18


def remove_background(image: Image.Image, padding: int = 24) -> tuple[Image.Image, dict[str, object]]:
    rgb = np.array(image.convert("RGB"), dtype=np.uint8)
    bg = estimate_background(rgb)
    diff = np.linalg.norm(rgb.astype(np.float32) - bg, axis=2)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    bg_hsv = cv2.cvtColor(np.uint8([[bg]]), cv2.COLOR_RGB2HSV)[0, 0]
    hue_delta = np.abs(hsv[:, :, 0].astype(np.int16) - int(bg_hsv[0]))
    hue_delta = np.minimum(hue_delta, 180 - hue_delta)
    magenta_bg = (
        (hue_delta <= 12)
        & (hsv[:, :, 1] >= 70)
        & (hsv[:, :, 2] >= 35)
        & (rgb[:, :, 1] <= 125)
    )
    diff[magenta_bg] = 0

    hard_fg = (diff > 46).astype(np.uint8) * 255
    kernel = np.ones((3, 3), np.uint8)
    hard_fg = cv2.morphologyEx(hard_fg, cv2.MORPH_OPEN, kernel, iterations=1)
    hard_fg = cv2.morphologyEx(hard_fg, cv2.MORPH_CLOSE, kernel, iterations=2)

    count, labels, stats, _ = cv2.connectedComponentsWithStats(hard_fg, 8)
    if count > 1:
        keep = np.zeros_like(hard_fg)
        min_area = max(64, int(rgb.shape[0] * rgb.shape[1] * 0.0004))
        for idx in range(1, count):
            if stats[idx, cv2.CC_STAT_AREA] >= min_area:
                keep[labels == idx] = 255
        hard_fg = keep

    soft_alpha = np.clip((diff - 18) * (255.0 / 44.0), 0, 255).astype(np.uint8)
    alpha = np.where(hard_fg > 0, np.maximum(soft_alpha, 210), soft_alpha)
    alpha = cv2.GaussianBlur(alpha.astype(np.uint8), (3, 3), 0)

    ys, xs = np.where(alpha > 12)
    if len(xs) == 0 or len(ys) == 0:
        rgba = np.dstack([rgb, alpha])
        return Image.fromarray(rgba, "RGBA"), {"cropped": False, "background_rgb": bg.astype(int).tolist()}

    x0 = max(int(xs.min()) - padding, 0)
    y0 = max(int(ys.min()) - padding, 0)
    x1 = min(int(xs.max()) + padding + 1, rgb.shape[1])
    y1 = min(int(ys.max()) + padding + 1, rgb.shape[0])
    rgba = np.dstack([rgb, alpha])[y0:y1, x0:x1]
    return Image.fromarray(rgba, "RGBA"), {
        "cropped": True,
        "crop_box": [x0, y0, x1, y1],
        "background_rgb": bg.astype(int).tolist(),
    }


def write_contact_sheet(files: Iterable[Path], output: Path, root: Path) -> None:
    files = list(files)
    if not files:
        return
    thumb = 128
    label_h = 28
    cols = 8
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * thumb, rows * (thumb + label_h)), (245, 241, 232, 255))
    for idx, path in enumerate(files):
        image = Image.open(path).convert("RGBA")
        image.thumbnail((thumb - 8, thumb - 8), Image.Resampling.LANCZOS)
        cell_x = (idx % cols) * thumb
        cell_y = (idx // cols) * (thumb + label_h)
        x = cell_x + (thumb - image.width) // 2
        y = cell_y + (thumb - image.height) // 2
        sheet.paste(image, (x, y), image)
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def process_assets(input_root: Path, output_root: Path) -> dict[str, object]:
    files = iter_pngs(input_root)
    counters: dict[str, int] = defaultdict(int)
    used_by_dir: dict[str, set[str]] = defaultdict(set)
    manifest = []
    rename_manifest = []
    renamed = 0
    cleaned_count = 0
    copied_count = 0
    unmapped_chatgpt = []

    for source in files:
        key = dir_key(source, input_root)
        target_dir = output_root / source.parent.relative_to(input_root)
        target_dir.mkdir(parents=True, exist_ok=True)
        name = output_name(source, input_root, counters, used_by_dir[key])
        target = target_dir / name
        rel_source = source.relative_to(input_root).as_posix()
        rel_target = target.relative_to(output_root).as_posix()
        if name != source.name:
            renamed += 1
            rename_manifest.append({"source": rel_source, "asset": rel_target})
        if CHATGPT_RE.match(slugify(source.stem)) and rel_source not in DESCRIPTIVE_RENAMES:
            unmapped_chatgpt.append(rel_source)

        with Image.open(source) as original:
            original_size = list(original.size)
            if has_magenta_border(original):
                cleaned, meta = remove_background(original)
                cleaned.save(target, compress_level=3)
                clean_size = list(cleaned.size)
                cleaned_count += 1
            else:
                shutil.copy2(source, target)
                clean_size = original_size
                meta = {
                    "cropped": False,
                    "background_removed": False,
                    "background_reason": "no_magenta_border",
                }
                copied_count += 1
        manifest.append(
            {
                "source": rel_source,
                "asset": rel_target,
                "original_size": original_size,
                "clean_size": clean_size,
                **meta,
            }
        )

    return {
        "count": len(manifest),
        "renamed": renamed,
        "cleaned_magenta": cleaned_count,
        "copied_without_cleanup": copied_count,
        "unmapped_chatgpt": unmapped_chatgpt,
        "assets": manifest,
        "renames": rename_manifest,
    }


def verify_alpha(root: Path) -> dict[str, int]:
    total = 0
    transparent = 0
    for path in iter_pngs(root):
        total += 1
        image = Image.open(path).convert("RGBA")
        alpha = np.array(image.getchannel("A"))
        if int((alpha < 250).sum()) > 0:
            transparent += 1
    return {"total_png": total, "png_with_transparency": transparent}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--backup-root", type=Path, default=DEFAULT_BACKUP_ROOT)
    parser.add_argument("--commit", action="store_true", help="Replace GPT-ASSETS after successful processing.")
    args = parser.parse_args()

    input_root = args.input.resolve()
    if not input_root.exists():
        raise SystemExit(f"Missing input folder: {input_root}")

    tmp_root = input_root.with_name(f"{input_root.name}.__processed_tmp")
    if tmp_root.exists():
        for attempt in range(5):
            try:
                shutil.rmtree(tmp_root)
                break
            except PermissionError:
                if attempt == 4:
                    raise
                time.sleep(1)
    tmp_root.mkdir(parents=True)

    manifest = process_assets(input_root, tmp_root)
    if manifest["unmapped_chatgpt"]:
        raise SystemExit(
            "Unmapped ChatGPT assets remain:\n"
            + "\n".join(f"- {path}" for path in manifest["unmapped_chatgpt"])
        )

    (tmp_root / "asset_manifest.json").write_text(
        json.dumps({"count": manifest["count"], "assets": manifest["assets"]}, indent=2),
        encoding="utf-8",
    )
    (tmp_root / "rename_manifest.json").write_text(
        json.dumps({"count": manifest["renamed"], "renames": manifest["renames"]}, indent=2),
        encoding="utf-8",
    )
    write_contact_sheet(iter_pngs(tmp_root)[:64], tmp_root / "_contact_sheet.png", tmp_root)
    alpha_report = verify_alpha(tmp_root)
    print(
        json.dumps(
            {
                "processed": manifest["count"],
                "renamed": manifest["renamed"],
                "cleaned_magenta": manifest["cleaned_magenta"],
                "copied_without_cleanup": manifest["copied_without_cleanup"],
                **alpha_report,
            },
            indent=2,
        )
    )

    if not args.commit:
        print(f"Dry output: {tmp_root}")
        return

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_root = args.backup_root.resolve()
    backup_root.mkdir(parents=True, exist_ok=True)
    backup = backup_root / f"{input_root.name}-originals-{stamp}"
    shutil.move(str(input_root), str(backup))
    shutil.move(str(tmp_root), str(input_root))
    print(f"Backup: {backup}")
    print(f"Final: {input_root}")


if __name__ == "__main__":
    main()
