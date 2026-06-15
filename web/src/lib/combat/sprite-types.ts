export type CombatSpriteLayer =
  | "shadow"
  | "legs"
  | "body"
  | "backArm"
  | "weapon"
  | "frontArm"
  | "head"
  | "helmet"
  | "cloak";

export type CombatSpriteKind = "tercioRecruit" | "enemyScout";
export type CombatWeaponKind = "pike" | "arquebus";

export type SpriteAnchor = [number, number];

export type LayeredCombatSpriteDefinition = {
  id: string;
  type: "layered";
  layers: Partial<Record<CombatSpriteLayer, string>>;
  anchors: Partial<Record<CombatSpriteLayer, SpriteAnchor>>;
  fallback: {
    coat: number;
    coatDark: number;
    hose: number;
    leather: number;
    metal: number;
    skin: number;
    rim: number;
  };
};
