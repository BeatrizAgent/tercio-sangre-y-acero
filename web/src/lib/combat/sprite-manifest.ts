import type { LayeredCombatSpriteDefinition } from "./sprite-types";

export const combatSpriteManifest = {
  tercioRecruit: {
    id: "tercio_recruit",
    type: "layered",
    layers: {
      shadow: "/assets/combat/sprites/soldiers/shadow.png",
      legs: "/assets/combat/sprites/soldiers/recruit_legs.png",
      body: "/assets/combat/sprites/soldiers/recruit_body.png",
      backArm: "/assets/combat/sprites/soldiers/recruit_back_arm.png",
      weapon: "/assets/combat/props/arquebus.png",
      frontArm: "/assets/combat/sprites/soldiers/recruit_front_arm.png",
      head: "/assets/combat/sprites/soldiers/recruit_head.png",
      helmet: "/assets/combat/sprites/soldiers/morion.png",
      cloak: "/assets/combat/sprites/soldiers/recruit_cloak.png",
    },
    anchors: {
      body: [0.5, 1],
      weapon: [0.2, 0.5],
      head: [0.5, 0.5],
    },
    fallback: {
      coat: 0x263d4b,
      coatDark: 0x14242d,
      hose: 0x6a563f,
      leather: 0x4c2d1e,
      metal: 0xaeb5b4,
      skin: 0xb9845a,
      rim: 0xd8c28b,
    },
  },
  enemyScout: {
    id: "enemy_scout",
    type: "layered",
    layers: {
      shadow: "/assets/combat/sprites/enemies/shadow.png",
      legs: "/assets/combat/sprites/enemies/scout_legs.png",
      body: "/assets/combat/sprites/enemies/scout_body.png",
      backArm: "/assets/combat/sprites/enemies/scout_back_arm.png",
      weapon: "/assets/combat/props/pike.png",
      frontArm: "/assets/combat/sprites/enemies/scout_front_arm.png",
      head: "/assets/combat/sprites/enemies/scout_head.png",
      helmet: "/assets/combat/sprites/enemies/morion.png",
      cloak: "/assets/combat/sprites/enemies/scout_cloak.png",
    },
    anchors: {
      body: [0.5, 1],
      weapon: [0.2, 0.5],
      head: [0.5, 0.5],
    },
    fallback: {
      coat: 0x354136,
      coatDark: 0x1f2a22,
      hose: 0x485047,
      leather: 0x4a2d1f,
      metal: 0x8e9695,
      skin: 0x9b6b49,
      rim: 0xb7934c,
    },
  },
} satisfies Record<string, LayeredCombatSpriteDefinition>;
