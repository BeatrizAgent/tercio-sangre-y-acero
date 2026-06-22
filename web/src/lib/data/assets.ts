// Asset registry and path helpers. The catalog is the single source of truth;
// we re-export a thin shim that matches the legacy AssetDefinition shape so
// existing UI components (which read `path` and `dimensions`) keep working.

import {
  assetDefinitions as catalogAssets,
} from "./catalog";
import type { AssetDefinition } from "../types";

function toLegacy(asset: (typeof catalogAssets)[number]): AssetDefinition {
  // publicPath is `/assets/gpt-bank/{file}.png`; legacy consumers expect
  // `path: "GPT-ASSETS/..."` so the legacy getAssetPublicPath works.
  // The catalog uses "silhouette"; legacy AssetPresentation uses "obscured".
  const file = asset.publicPath.replace(/^\/assets\/gpt-bank\//, "");
  const validPresentations: AssetDefinition["presentation"][] = ["normal", "blurred", "obscured"];
  const pres = validPresentations.includes(asset.presentation as never)
    ? (asset.presentation as AssetDefinition["presentation"])
    : "obscured";
  return {
    id: asset.id,
    category: asset.kind,
    path: `GPT-ASSETS/${file}`,
    source: "chatgpt_manual",
    dimensions: [asset.width, asset.height],
    transparent: true,
    usage: asset.usage,
    mature: asset.mature,
    presentation: pres,
  };
}

export const assetDefinitions: AssetDefinition[] = catalogAssets.map(toLegacy);

export function getAsset(assetId: string | undefined): AssetDefinition | undefined {
  if (!assetId) return undefined;
  return assetDefinitions.find((a) => a.id === assetId);
}

export function getAssetPathById(assetId: string | undefined): string | undefined {
  const a = getAsset(assetId);
  return a ? getAssetPublicPath(a) : undefined;
}

export function assetPath(relativePath: string): string {
  return `/assets/gpt-bank/${relativePath}`;
}

export function getAssetPublicPath(asset: AssetDefinition): string {
  return `/${asset.path.replace(/^GPT-ASSETS\//, "assets/gpt-bank/")}`;
}

export function getAssetDimensionsById(assetId: string): [number, number] {
  return (
    assetDefinitions.find((asset) => asset.id === assetId)?.dimensions ?? [1024, 1536]
  );
}
