from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError as exc:
    raise SystemExit("Missing dependency: requests. Run `pip install -r requirements.txt`.") from exc

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Missing dependency: pillow. Run `pip install pillow`.") from exc


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / "assets" / "generated" / "tercio"
COMFY_OUTPUT_ROOT = Path("C:/AI/RPGMakerAgenticLab/comfyui/ComfyUI/output")
EXPECTED_ASSET_COUNT = 100
DEFAULT_HOST = "http://127.0.0.1:8188"

REALVIS_CKPT = "realvisxlV50_v50LightningBakedvae.safetensors"
DREAMSHAPER_CKPT = "dreamshaperXL_sfwLightningDPMSDE.safetensors"
ICON_LORA = "game_icon_diablo_style.safetensors"
PORTRAIT_LORA = r"tercios_portraits\cinematic_anamorphic_portraits_sdxl.safetensors"
DETAIL_LORA = r"tercios_utility\add-detail-xl.safetensors"

COMMON_NEGATIVE = (
    "fantasy, magic, modern weapon, modern firearm, "
    "modern uniform, modern military gear, glossy armor, polished heroic armor, clean studio, "
    "neon, sci fi, cyberpunk, scenic background, landscape, room background, complex backdrop, "
    "drop shadow, cast shadow, text, letters, watermark, logo, signature, UI, frame, border, "
    "sexualized, cleavage, fetish, celebrity, public figure, real person likeness, gore focus, "
    "extra fingers, malformed hands, deformed, low quality, blurry, jpeg artifacts"
)

ICON_NEGATIVE = (
    f"{COMMON_NEGATIVE}, no person, no human, no soldier, no man, no woman, no body, no face, "
    "no helmeted figure, no armor suit, no hands, no hand holding object, no full character, "
    "no demonic, no gothic fantasy, no ornate fantasy weapon, no spikes, no jagged blade, "
    "no gem, no glowing rune, no double blade, only one isolated object"
)

COMMON_CLEAN_PAINTERLY = (
    "clean historical painterly style, rich color illustration, fine brushstrokes, clear studio lighting, "
    "elegant Renaissance game art, no modern gear, cohesive asset style"
)

ICON_CLEAN_PAINTERLY_STYLE = (
    "clean material texture, polished metal, smooth leather, fine wood, Renaissance game icon, "
    "no heroic shine, clear details"
)

SPRITE_MATTE = (
    "flat pure chroma key magenta background, solid #ff00ff backdrop, black background acceptable for character cg cutout, no gradient, "
    "floating asset, no floor, no ground contact, no cast shadow, no floor contact shadow, "
    "clean mask edge, easy background removal"
)


@dataclass(frozen=True)
class LoraSpec:
    name: str
    strength: float


@dataclass(frozen=True)
class AssetSpec:
    asset_id: str
    category: str
    prompt: str
    checkpoint: str
    width: int
    height: int
    variants: int
    steps: int
    cfg: float
    negative_prompt: str = COMMON_NEGATIVE
    loras: tuple[LoraSpec, ...] = field(default_factory=tuple)

    @property
    def output_dir(self) -> Path:
        return Path("assets/generated/tercio") / self.category


def stable_seed(asset_id: str, variant: int) -> int:
    digest = hashlib.blake2b(f"{asset_id}:{variant}".encode("utf-8"), digest_size=8).digest()
    return int.from_bytes(digest, "big", signed=False)


def _icon(asset_id: str, subject: str, use_icon_lora: bool = True) -> AssetSpec:
    prompt = (
        f"game icon, {subject}, single centered object, readable silhouette, isolated inventory asset, "
        "2d painted game icon, full object visible with padding, "
        "clean material texture, polished metal, smooth leather, fine wood, clear details, no text, no hands, no character, "
        f"{SPRITE_MATTE}, "
        f"{ICON_CLEAN_PAINTERLY_STYLE}"
    )
    loras = (LoraSpec(ICON_LORA, 0.15),) if use_icon_lora else ()
    return AssetSpec(
        asset_id=asset_id,
        category="icons",
        prompt=prompt,
        checkpoint=DREAMSHAPER_CKPT,
        width=1024,
        height=1024,
        variants=4,
        steps=6,
        cfg=1.8,
        negative_prompt=ICON_NEGATIVE,
        loras=loras,
    )


def _scene(asset_id: str, prompt: str, lora: LoraSpec | None = None) -> AssetSpec:
    loras = []
    if lora:
        # Use lower strength for painterly style
        loras.append(LoraSpec(lora.name, lora.strength * 0.5))
    return AssetSpec(
        asset_id=asset_id,
        category="scenes",
        prompt=f"{prompt}, elegant game illustration, {COMMON_CLEAN_PAINTERLY}",
        checkpoint=DREAMSHAPER_CKPT,
        width=1344,
        height=768,
        variants=3,
        steps=6,
        cfg=1.8,
        negative_prompt=COMMON_NEGATIVE,
        loras=tuple(loras),
    )


def _portrait(asset_id: str, prompt: str) -> AssetSpec:
    return AssetSpec(
        asset_id=asset_id,
        category="portraits",
        prompt=f"{prompt}, character cg, black background, elegant historical portrait painting, waist-up subject, {SPRITE_MATTE}, {COMMON_CLEAN_PAINTERLY}",
        checkpoint=DREAMSHAPER_CKPT,
        width=832,
        height=1216,
        variants=3,
        steps=6,
        cfg=1.7,
        negative_prompt=COMMON_NEGATIVE,
        loras=(), # DreamShaper XL works beautifully for portraits without realism LoRAs
    )


def build_asset_plan() -> list[AssetSpec]:
    icons = [
        _icon("rusty_pike", "very long straight infantry pike, clean wooden shaft, steel leaf spear tip, no rust, no axe blade, no halberd, no fantasy polearm"),
        _icon("chipped_sword", "short side sword with clean steel blade and plain grip"),
        _icon("arquebus_with_worn_stock", "early matchlock arquebus with clean wooden stock and dark steel barrel"),
        _icon("wet_powder_flask", "leather powder flask with brass cap, clean, dry"),
        _icon("cheap_morion", "morion helmet with clean polished steel surface"),
        _icon("dented_cuirass", "steel cuirass breastplate with clean leather straps"),
        _icon("patched_doublet", "clean woolen doublet, neat stitching"),
        _icon("old_boots", "sturdy clean leather marching boots"),
        _icon("clean_bandage", "rolled washed linen bandage", use_icon_lora=False),
        _icon("wine_skin", "leather wineskin with tied neck and strap", use_icon_lora=False),
        _icon("hard_bread", "campaign bread ration, round loaf", use_icon_lora=False),
        _icon("doubtful_relic", "small tarnished devotional relic case with cord", use_icon_lora=False),
        _icon("captured_banner_fragment", "banner fragment, clean colorful cloth, intact edge", use_icon_lora=False),
    ]
    scenes = [
        _scene(
            "barracks",
            "orderly tercio barracks, clean boots under bunks, pikes stacked by wall, warm candles, clean floor, resting soldiers",
            LoraSpec(r"tercios_scenes\military_b4rr4cks.safetensors", 0.40),
        ),
        _scene(
            "armory_workshop",
            "renaissance armory workshop, morions, cuirasses, pikes, arquebuses, leather straps, neat timber, quartermaster table",
            LoraSpec(r"tercios_scenes\Renaissance_w0rksh0p.safetensors", 0.45),
        ),
        _scene("hospital", "field hospital tent, clean beds, bandages, surgeon tools, rain outside, calm and safe environment"),
        _scene("night_watch_rain", "tercio soldier on night watch, holding pike, lantern glow, clear night sky"),
        _scene("muddy_road_patrol", "road through countryside, tercio patrol silhouettes, banners, overcast sky, clean composition"),
        _scene("powder_escort_front", "guarded powder convoy, barrels under canvas, arquebusiers, clean road, early modern campaign"),
        _scene("siege_breach", "distant siege breach, smoke, broken masonry, pikes ready, soldiers waiting, heroic composition"),
        _scene(
            "tavern_duel",
            "old-world tavern interior, clean and elegant duel before blades drawn, soldiers around candles, dramatic lighting",
            LoraSpec(r"tercios_scenes\old-world_medieval_t4v3rn.safetensors", 0.40),
        ),
    ]
    portraits = [
        _portrait("bisono_recruit", "poor Spanish tercio recruit, wool doublet, cheap morion helmet, clean young face, neat collar, warm camp light"),
        _portrait("veteran_soldier", "tercio veteran, weathered face, clean cuirass, dark beard, hard eyes"),
        _portrait("captain", "tercio captain, austere command presence, red sash, morion held under arm, steel cuirass, campaign tent"),
        _portrait("armorer", "early modern armorer, clean leather apron, helmets and pikes behind him, workshop candlelight"),
        _portrait("field_surgeon", "field surgeon in campaign hospital, clean apron, bandages, herbs, tired humane expression"),
        _portrait("chaplain", "tercio chaplain, plain black cassock, small crucifix, campaign dust, solemn face, candlelit tent"),
        _portrait("vivandera", "camp supplier woman, practical modest clothing, carrying bread and wineskin, road beside military camp"),
        _portrait("enemy_scout", "enemy scout, cloak, wary expression, early modern border campaign, no modern gear, low light"),
    ]
    return icons + scenes + portraits


def build_workflow(asset: AssetSpec, variant: int) -> dict[str, dict[str, Any]]:
    workflow: dict[str, dict[str, Any]] = {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": asset.checkpoint}},
    }
    model_ref: list[Any] = ["1", 0]
    clip_ref: list[Any] = ["1", 1]
    next_id = 2

    for lora in asset.loras:
        node_id = str(next_id)
        workflow[node_id] = {
            "class_type": "LoraLoader",
            "inputs": {
                "model": model_ref,
                "clip": clip_ref,
                "lora_name": lora.name,
                "strength_model": lora.strength,
                "strength_clip": lora.strength,
            },
        }
        model_ref = [node_id, 0]
        clip_ref = [node_id, 1]
        next_id += 1

    positive_id = str(next_id)
    negative_id = str(next_id + 1)
    latent_id = str(next_id + 2)
    sampler_id = str(next_id + 3)
    decode_id = str(next_id + 4)
    save_id = str(next_id + 5)

    workflow[positive_id] = {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": clip_ref, "text": asset.prompt},
    }
    workflow[negative_id] = {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": clip_ref, "text": asset.negative_prompt},
    }
    workflow[latent_id] = {
        "class_type": "EmptyLatentImage",
        "inputs": {"width": asset.width, "height": asset.height, "batch_size": 1},
    }
    workflow[sampler_id] = {
        "class_type": "KSampler",
        "inputs": {
            "model": model_ref,
            "seed": stable_seed(asset.asset_id, variant),
            "steps": asset.steps,
            "cfg": asset.cfg,
            "sampler_name": "dpmpp_sde",
            "scheduler": "karras",
            "positive": [positive_id, 0],
            "negative": [negative_id, 0],
            "latent_image": [latent_id, 0],
            "denoise": 1.0,
        },
    }
    workflow[decode_id] = {
        "class_type": "VAEDecode",
        "inputs": {"samples": [sampler_id, 0], "vae": ["1", 2]},
    }
    workflow[save_id] = {
        "class_type": "SaveImage",
        "inputs": {
            "images": [decode_id, 0],
            "filename_prefix": f"tercio/{asset.category}/{asset.asset_id}_v{variant:02d}",
        },
    }
    return workflow


def filter_jobs(
    assets: list[AssetSpec],
    category: str | None = None,
    asset_id: str | None = None,
) -> list[tuple[AssetSpec, int]]:
    selected = [
        asset
        for asset in assets
        if (category is None or asset.category == category) and (asset_id is None or asset.asset_id == asset_id)
    ]
    return [(asset, variant) for asset in selected for variant in range(1, asset.variants + 1)]


def require_comfy_assets(host: str) -> None:
    stats = requests.get(f"{host}/system_stats", timeout=10)
    stats.raise_for_status()

    ckpts = requests.get(f"{host}/object_info/CheckpointLoaderSimple", timeout=10)
    ckpts.raise_for_status()
    ckpt_names = set(ckpts.json()["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0])

    loras = requests.get(f"{host}/object_info/LoraLoader", timeout=10)
    loras.raise_for_status()
    lora_names = set(loras.json()["LoraLoader"]["input"]["required"]["lora_name"][0])

    assets = build_asset_plan()
    missing_ckpts = sorted({asset.checkpoint for asset in assets} - ckpt_names)
    missing_loras = sorted({lora.name for asset in assets for lora in asset.loras} - lora_names)
    if missing_ckpts or missing_loras:
        raise SystemExit(f"Missing ComfyUI assets. checkpoints={missing_ckpts} loras={missing_loras}")


def queue_workflow(host: str, workflow: dict[str, dict[str, Any]]) -> str:
    response = requests.post(f"{host}/prompt", json={"prompt": workflow}, timeout=30)
    response.raise_for_status()
    data = response.json()
    prompt_id = data.get("prompt_id")
    if not prompt_id:
        raise RuntimeError(f"ComfyUI did not return prompt_id: {data}")
    return str(prompt_id)


def wait_for_history(host: str, prompt_id: str, timeout_seconds: int) -> dict[str, Any]:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        response = requests.get(f"{host}/history/{prompt_id}", timeout=10)
        response.raise_for_status()
        data = response.json()
        if prompt_id in data:
            entry = data[prompt_id]
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                raise RuntimeError(json.dumps(status, indent=2))
            
            # If execution has outputs or is marked completed (e.g. cached), return it
            outputs = entry.get("outputs", {})
            completed = status.get("completed", False)
            if outputs or completed:
                return entry
        time.sleep(1)
    raise TimeoutError(f"Timed out waiting for ComfyUI prompt {prompt_id}")


def copy_saved_image(entry: dict[str, Any], asset: AssetSpec, variant: int) -> Path:
    images: list[dict[str, Any]] = []
    for output in entry.get("outputs", {}).values():
        images.extend(output.get("images", []))
    
    if not images:
        # Cached run! Find the existing file in ComfyUI output root matching the pattern
        pattern = f"{asset.asset_id}_v{variant:02d}*.png"
        search_dir = COMFY_OUTPUT_ROOT / asset.category
        candidates = []
        if search_dir.exists():
            candidates.extend(search_dir.glob(pattern))
        if not candidates:
            # Fallback to search recursively in ComfyUI output root
            candidates.extend(COMFY_OUTPUT_ROOT.glob(f"**/{pattern}"))
            
        if not candidates:
            raise RuntimeError(f"No images in ComfyUI history and no files found matching pattern '{pattern}' in '{COMFY_OUTPUT_ROOT}'")
            
        # Sort by modification time to get the latest
        candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        source = candidates[0]
    else:
        image = images[0]
        filename = image["filename"]
        subfolder = image.get("subfolder") or ""
        source = COMFY_OUTPUT_ROOT / subfolder / filename
        if not source.exists():
            raise FileNotFoundError(source)

    destination_dir = ROOT / asset.output_dir
    destination_dir.mkdir(parents=True, exist_ok=True)
    destination = destination_dir / f"{asset.asset_id}_v{variant:02d}.png"
    shutil.copy2(source, destination)
    if asset.category in {"icons", "portraits"}:
        remove_edge_matte(destination)
        
    # Also sync to the Next.js web client public assets directory
    web_dir = ROOT / "web" / "public" / "assets" / "generated" / asset.category
    web_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(destination, web_dir / destination.name)
    
    return destination


def _color_distance(left: tuple[int, int, int], right: tuple[int, int, int]) -> int:
    return max(abs(left[0] - right[0]), abs(left[1] - right[1]), abs(left[2] - right[2]))


def remove_edge_matte(path: Path, threshold: int = 70) -> None:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    corners = [
        pixels[0, 0][:3],
        pixels[width - 1, 0][:3],
        pixels[0, height - 1][:3],
        pixels[width - 1, height - 1][:3],
    ]
    matte = tuple(sum(channel) // len(corners) for channel in zip(*corners))
    queue: list[tuple[int, int]] = []
    seen: set[tuple[int, int]] = set()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.pop()
        if (x, y) in seen or x < 0 or y < 0 or x >= width or y >= height:
            continue
        seen.add((x, y))
        red, green, blue, alpha = pixels[x, y]
        if alpha == 0:
            continue
        if _color_distance((red, green, blue), matte) > threshold:
            continue
        pixels[x, y] = (red, green, blue, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    image.save(path)


def png_dimensions(path: Path) -> tuple[int, int]:
    with path.open("rb") as handle:
        header = handle.read(24)
    if header[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Not a PNG: {path}")
    width = int.from_bytes(header[16:20], "big")
    height = int.from_bytes(header[20:24], "big")
    return width, height


def write_index(index: dict[str, Any]) -> Path:
    # Sync index in root assets
    output = OUTPUT_ROOT / "asset_index.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(index, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    
    # Sync index in Next.js web client public assets
    web_output = ROOT / "web" / "public" / "assets" / "generated" / "asset_index.json"
    web_output.parent.mkdir(parents=True, exist_ok=True)
    web_output.write_text(json.dumps(index, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    
    return output


def build_existing_output_index(assets: list[AssetSpec]) -> dict[str, Any]:
    index: dict[str, Any] = {
        "schema_version": 1,
        "style": "clean_painterly",
        "expected_total": EXPECTED_ASSET_COUNT,
        "assets": {},
    }
    for asset in assets:
        variants = [
            str((asset.output_dir / f"{asset.asset_id}_v{variant:02d}.png").as_posix())
            for variant in range(1, asset.variants + 1)
        ]
        index["assets"][asset.asset_id] = {
            "category": asset.category,
            "primary": variants[0],
            "variants": variants,
            "prompt": asset.prompt,
            "checkpoint": asset.checkpoint,
            "loras": [lora.__dict__ for lora in asset.loras],
        }
    return index


def validate_outputs(assets: list[AssetSpec]) -> None:
    missing: list[str] = []
    wrong_dims: list[str] = []
    for asset in assets:
        for variant in range(1, asset.variants + 1):
            path = ROOT / asset.output_dir / f"{asset.asset_id}_v{variant:02d}.png"
            if not path.exists() or path.stat().st_size == 0:
                missing.append(str(path))
                continue
            if png_dimensions(path) != (asset.width, asset.height):
                wrong_dims.append(f"{path}: {png_dimensions(path)} expected {(asset.width, asset.height)}")
    if missing or wrong_dims:
        raise SystemExit("Asset validation failed:\n" + "\n".join(missing + wrong_dims))


def generate_assets(
    host: str,
    timeout_seconds: int,
    limit: int | None = None,
    jobs: list[tuple[AssetSpec, int]] | None = None,
) -> dict[str, Any]:
    assets = build_asset_plan()
    jobs = jobs if jobs is not None else filter_jobs(assets)
    if limit is not None:
        jobs = jobs[:limit]

    index: dict[str, Any] = {
        "schema_version": 1,
        "style": "clean_painterly",
        "expected_total": EXPECTED_ASSET_COUNT,
        "assets": {},
    }
    for asset, variant in jobs:
        workflow = build_workflow(asset, variant)
        prompt_id = queue_workflow(host, workflow)
        entry = wait_for_history(host, prompt_id, timeout_seconds)
        destination = copy_saved_image(entry, asset, variant)
        row = index["assets"].setdefault(
            asset.asset_id,
            {
                "category": asset.category,
                "primary": str((asset.output_dir / f"{asset.asset_id}_v01.png").as_posix()),
                "variants": [],
                "prompt": asset.prompt,
                "checkpoint": asset.checkpoint,
                "loras": [lora.__dict__ for lora in asset.loras],
            },
        )
        row["variants"].append(str(destination.relative_to(ROOT).as_posix()))
        print(f"generated {asset.asset_id} v{variant:02d} -> {destination}")

    write_index(index)
    return index


def print_dry_run() -> None:
    assets = build_asset_plan()
    total = sum(asset.variants for asset in assets)
    print(f"Assets: {len(assets)}")
    print(f"Expected PNGs: {total}")
    for category in ("icons", "scenes", "portraits"):
        rows = [asset for asset in assets if asset.category == category]
        print(f"{category}: {len(rows)} assets, {sum(asset.variants for asset in rows)} PNGs")
    if total != EXPECTED_ASSET_COUNT:
        raise SystemExit(f"Expected {EXPECTED_ASSET_COUNT}, got {total}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate reproducible Tercio MVP assets through local ComfyUI.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--generate", action="store_true")
    parser.add_argument("--validate", action="store_true")
    parser.add_argument("--reindex", action="store_true")
    parser.add_argument("--limit", type=int, default=None, help="Generate only the first N jobs; useful for smoke tests.")
    parser.add_argument("--category", choices=["icons", "scenes", "portraits"], default=None)
    parser.add_argument("--asset-id", default=None)
    parser.add_argument("--timeout-seconds", type=int, default=600)
    args = parser.parse_args()

    if args.dry_run:
        print_dry_run()
        return

    require_comfy_assets(args.host)

    if args.generate:
        assets = build_asset_plan()
        jobs = filter_jobs(assets, category=args.category, asset_id=args.asset_id)
        if args.limit is not None:
            jobs = jobs[: args.limit]
        generate_assets(args.host, args.timeout_seconds, None, jobs=jobs)

    if args.reindex:
        path = write_index(build_existing_output_index(build_asset_plan()))
        print(f"Asset index written: {path}")

    if args.validate:
        validate_outputs(build_asset_plan())
        print("Asset validation passed.")


if __name__ == "__main__":
    main()
