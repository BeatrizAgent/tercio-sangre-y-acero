// UI atom for asset-backed icons. Lives in ui/ because it is a pure
// presentation primitive consumed by both the game layer and the design system.

import { uiIconPaths } from "@/lib/data/ui-paths";

type UiIconId = keyof typeof uiIconPaths;

interface UiAssetIconProps {
  id: UiIconId;
  label: string;
  className?: string;
}

export function UiAssetIcon({ id, label, className = "h-5 w-5" }: UiAssetIconProps) {
  return (
    <span className={`ui-asset-icon inline-flex shrink-0 items-center justify-center ${className}`}>
      <img src={uiIconPaths[id]} alt={label} className="h-full w-full object-contain" />
    </span>
  );
}
