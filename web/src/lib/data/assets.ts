// Asset registry and path helpers. Single source of truth for asset IDs to
// public URLs. UI path maps (icons, role badges, ordinance art) live in
// `./ui-paths.ts` so this file stays focused on asset metadata.

import assetsJson from "../../../data/json/assets.json";
import type { AssetDefinition } from "../types";

export const assetDefinitions = assetsJson as AssetDefinition[];

export function assetPath(relativePath: string): string {
  return `/assets/gpt-bank/${relativePath}`;
}

export function getAssetPublicPath(asset: AssetDefinition): string {
  return `/${asset.path.replace(/^GPT-ASSETS\//, "assets/gpt-bank/")}`;
}

export function getAsset(assetId: string | undefined) {
  if (!assetId) return undefined;
  return assetDefinitions.find((entry) => entry.id === assetId);
}

export function getAssetPathById(assetId: string | undefined): string | undefined {
  const asset = getAsset(assetId);
  return asset ? getAssetPublicPath(asset) : undefined;
}

export function getAssetDimensionsById(assetId: string): [number, number] {
  return assetDefinitions.find((asset) => asset.id === assetId)?.dimensions ?? [1024, 1536];
}
