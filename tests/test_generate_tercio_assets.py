import unittest
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.generate_tercio_assets import (
    EXPECTED_ASSET_COUNT,
    build_existing_output_index,
    build_asset_plan,
    filter_jobs,
    build_workflow,
    remove_edge_matte,
    stable_seed,
)


class TercioAssetGenerationTests(unittest.TestCase):
    def test_asset_plan_contains_expected_mvp_counts_and_paths(self):
        assets = build_asset_plan()
        by_category = {}
        for asset in assets:
            by_category.setdefault(asset.category, []).append(asset)

        self.assertEqual(EXPECTED_ASSET_COUNT, 100)
        self.assertEqual(len(by_category["icons"]), 13)
        self.assertEqual(len(by_category["scenes"]), 8)
        self.assertEqual(len(by_category["portraits"]), 8)
        self.assertEqual(sum(asset.variants for asset in assets), EXPECTED_ASSET_COUNT)
        self.assertEqual(by_category["icons"][0].output_dir.as_posix(), "assets/generated/tercio/icons")

    def test_seed_is_deterministic_and_variant_sensitive(self):
        self.assertEqual(stable_seed("rusty_pike", 1), stable_seed("rusty_pike", 1))
        self.assertNotEqual(stable_seed("rusty_pike", 1), stable_seed("rusty_pike", 2))

    def test_icon_workflow_uses_diablo_icon_lora_and_expected_save_prefix(self):
        icon = next(asset for asset in build_asset_plan() if asset.asset_id == "rusty_pike")
        workflow = build_workflow(icon, 1)

        lora_nodes = [node for node in workflow.values() if node["class_type"] == "LoraLoader"]
        self.assertEqual(lora_nodes[0]["inputs"]["lora_name"], "game_icon_diablo_style.safetensors")
        self.assertEqual(lora_nodes[0]["inputs"]["strength_model"], 0.25)

        sampler = next(node for node in workflow.values() if node["class_type"] == "KSampler")
        self.assertEqual(sampler["inputs"]["steps"], 6)
        self.assertEqual(sampler["inputs"]["cfg"], 1.8)

        save = next(node for node in workflow.values() if node["class_type"] == "SaveImage")
        self.assertEqual(save["inputs"]["filename_prefix"], "tercio/icons/rusty_pike_v01")

    def test_soft_object_icons_do_not_use_diablo_lora(self):
        bread = next(asset for asset in build_asset_plan() if asset.asset_id == "hard_bread")
        workflow = build_workflow(bread, 1)

        lora_nodes = [node for node in workflow.values() if node["class_type"] == "LoraLoader"]
        self.assertEqual(lora_nodes, [])

    def test_filter_jobs_can_select_icon_category_only(self):
        jobs = filter_jobs(build_asset_plan(), category="icons")
        self.assertEqual(len(jobs), 52)
        self.assertTrue(all(asset.category == "icons" for asset, _variant in jobs))

    def test_existing_output_index_keeps_all_assets(self):
        index = build_existing_output_index(build_asset_plan())
        self.assertEqual(index["expected_total"], EXPECTED_ASSET_COUNT)
        self.assertEqual(len(index["assets"]), 29)
        self.assertEqual(len(index["assets"]["rusty_pike"]["variants"]), 4)

    def test_icon_negative_prompt_blocks_human_figures_without_blocking_portraits(self):
        icon = next(asset for asset in build_asset_plan() if asset.asset_id == "rusty_pike")
        portrait = next(asset for asset in build_asset_plan() if asset.asset_id == "bisono_recruit")

        self.assertIn("no person", icon.negative_prompt)
        self.assertIn("no demonic", icon.negative_prompt)
        self.assertIn("no ornate fantasy weapon", icon.negative_prompt)
        self.assertNotIn("no person", portrait.negative_prompt)
        self.assertIn("character cg, black background", portrait.prompt)
        self.assertNotIn("character_cg.safetensors", str(build_workflow(portrait, 1)))

    def test_remove_edge_matte_makes_edge_background_transparent(self):
        with TemporaryDirectory() as tmp:
            path = Path(tmp) / "sprite.png"
            image = Image.new("RGB", (5, 5), (200, 50, 180))
            image.putpixel((2, 2), (20, 20, 20))
            image.save(path)

            remove_edge_matte(path)

            result = Image.open(path).convert("RGBA")
            self.assertEqual(result.getpixel((0, 0))[3], 0)
            self.assertEqual(result.getpixel((2, 2))[3], 255)


if __name__ == "__main__":
    unittest.main()
