#!/usr/bin/env node
// items.mjs — define 120+ items covering all slots/types/tiers.

import { newItem, emptyStats, tierPrice } from "./core.mjs";

export function buildItems() {
  const items = [];

  // ---------------------------------------------------------------------------
  // WEAPONS: PIKES (8)
  // ---------------------------------------------------------------------------
  items.push(newItem({
    id: "weapon_pica_gastada_001",
    name: "Pica gastada",
    slot: "weapon", type: "pike", tier: 1, price: 14,
    assetId: "asset_pike_common_001", footprint: { w: 1, h: 3 },
    description: "Pica de enebro, punta mal templada. Apenas sirve para alinear.",
    stats: { ...emptyStats(), pike: 1, discipline: 1, damageMin: 1, damageMax: 4 },
    tags: ["early", "poor", "pike"],
  }));
  items.push(newItem({
    id: "weapon_pica_corta_001",
    name: "Pica corta",
    slot: "weapon", type: "pike", tier: 1, price: 18,
    assetId: "asset_pike_common_002", footprint: { w: 1, h: 3 },
    description: "Pica corta, madera de fresno. Empuja y se dobla.",
    stats: { ...emptyStats(), pike: 1, discipline: 0, damageMin: 1, damageMax: 4 },
    tags: ["early", "pike"],
  }));
  items.push(newItem({
    id: "weapon_pica_ash_001",
    name: "Pica de fresno",
    slot: "weapon", type: "pike", tier: 2, price: 70,
    assetId: "asset_pike_uncommon_001", footprint: { w: 1, h: 3 },
    description: "Asta recta de fresno, regatón de hierro. Aguanta una carga.",
    stats: { ...emptyStats(), pike: 2, discipline: 1, damageMin: 2, damageMax: 5 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "pike"],
  }));
  items.push(newItem({
    id: "weapon_pica_haya_001",
    name: "Pica de haya",
    slot: "weapon", type: "pike", tier: 2, price: 80,
    assetId: "asset_pike_uncommon_002", footprint: { w: 1, h: 3 },
    description: "Asta de haya bien contrapesada. Mejor empuñadura.",
    stats: { ...emptyStats(), pike: 2, discipline: 1, damageMin: 2, damageMax: 6 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "pike"],
  }));
  items.push(newItem({
    id: "weapon_pica_sargento_001",
    name: "Pica de sargento",
    slot: "weapon", type: "pike", tier: 3, price: 220,
    assetId: "asset_pike_rare_001", footprint: { w: 1, h: 3 },
    description: "Pica de oficial, mejor temple y banderín.",
    stats: { ...emptyStats(), pike: 3, discipline: 2, damageMin: 3, damageMax: 7 },
    requirements: { level: 3, rankId: "cabo_de_escuadra" },
    passives: [{ id: "linea_picas", label: "Línea de picas", description: "+1 pica con disciplina ≥4." }],
    tags: ["officer", "pike"],
  }));
  items.push(newItem({
    id: "weapon_pica_flandes_001",
    name: "Pica de Flandes",
    slot: "weapon", type: "pike", tier: 3, price: 260,
    assetId: "asset_pike_rare_002", footprint: { w: 1, h: 3 },
    description: "Hierro de Flandes, asta noble.",
    stats: { ...emptyStats(), pike: 3, discipline: 2, damageMin: 3, damageMax: 8 },
    requirements: { level: 3, rankId: "sargento" },
    tags: ["flandes", "pike"],
  }));
  items.push(newItem({
    id: "weapon_pica_armero_001",
    name: "Pica del armero",
    slot: "weapon", type: "pike", tier: 4, price: 540,
    assetId: "asset_pike_veteran_001", footprint: { w: 1, h: 3 },
    description: "Asta firmada por el armero del tercio. Pesa donde debe.",
    stats: { ...emptyStats(), pike: 4, discipline: 2, damageMin: 5, damageMax: 9 },
    requirements: { level: 4, rankId: "alferez" },
    passives: [{ id: "linea_picas_2", label: "Línea de picas", description: "+2 pica con disciplina ≥4." }],
    tags: ["veteran", "pike"],
  }));
  items.push(newItem({
    id: "weapon_pica_capitan_001",
    name: "Pica del capitán",
    slot: "weapon", type: "pike", tier: 4, price: 620,
    assetId: "asset_pike_masterwork_001", footprint: { w: 1, h: 3 },
    description: "Ferrule dorada, vaina de cuero repujado.",
    stats: { ...emptyStats(), pike: 4, discipline: 2, command: 1, damageMin: 5, damageMax: 10 },
    requirements: { level: 4, rankId: "capitan" },
    passives: [{ id: "mirada_capitan", label: "Mirada del capitán", description: "+1 mando." }],
    tags: ["captain", "pike", "masterwork"],
  }));

  // ---------------------------------------------------------------------------
  // WEAPONS: SWORDS (8)
  // ---------------------------------------------------------------------------
  items.push(newItem({
    id: "weapon_ropera_ronosa_001",
    name: "Ropera roñosa",
    slot: "weapon", type: "sword", tier: 1, price: 14,
    assetId: "asset_sword_common_001", footprint: { w: 1, h: 2 },
    description: "Hoja de cinto, filo gastado. Mejor en el envés que en el tajo.",
    stats: { ...emptyStats(), sword: 1, damageMin: 1, damageMax: 3 },
    tags: ["early", "poor", "blade"],
  }));
  items.push(newItem({
    id: "weapon_daga_001",
    name: "Daga de cinto",
    slot: "offhand", type: "sword", tier: 1, price: 12,
    assetId: "asset_sword_common_002", footprint: { w: 1, h: 1 },
    description: "Daga corta, hoja sin filo y mango de hueso.",
    stats: { ...emptyStats(), sword: 1, damageMin: 1, damageMax: 2 },
    tags: ["early", "blade"],
  }));
  items.push(newItem({
    id: "weapon_cazoleta_001",
    name: "Espada de cazoleta",
    slot: "weapon", type: "sword", tier: 2, price: 75,
    assetId: "asset_sword_uncommon_001", footprint: { w: 1, h: 2 },
    description: "Hoja larga, cazoleta, peso adelante.",
    stats: { ...emptyStats(), sword: 2, cunning: 1, damageMin: 2, damageMax: 5 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "blade"],
  }));
  items.push(newItem({
    id: "weapon_ancha_flandes_001",
    name: "Espada ancha de Flandes",
    slot: "weapon", type: "sword", tier: 2, price: 95,
    assetId: "asset_sword_uncommon_002", footprint: { w: 1, h: 2 },
    description: "Hoja ancha, gavilanes rectos. Sirve para partir y para parar.",
    stats: { ...emptyStats(), sword: 2, discipline: 1, damageMin: 2, damageMax: 6 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["flandes", "blade"],
  }));
  items.push(newItem({
    id: "weapon_toledo_001",
    name: "Ropera de Toledo",
    slot: "weapon", type: "sword", tier: 3, price: 240,
    assetId: "asset_sword_rare_001", footprint: { w: 1, h: 2 },
    description: "Acero de Toledo, gavilanes curvados. Ya tiene nombre.",
    stats: { ...emptyStats(), sword: 3, discipline: 1, damageMin: 3, damageMax: 7 },
    requirements: { level: 3, rankId: "cabo_de_escuadra" },
    passives: [{ id: "primer_golpe", label: "Primer golpe", description: "+1 espada en el primer golpe." }],
    tags: ["officer", "blade"],
  }));
  items.push(newItem({
    id: "weapon_veterana_001",
    name: "Espada con grabados",
    slot: "weapon", type: "sword", tier: 3, price: 280,
    assetId: "asset_sword_rare_002", footprint: { w: 1, h: 2 },
    description: "Hoja con grabados de campaña. Vaina repujada.",
    stats: { ...emptyStats(), sword: 3, cunning: 1, damageMin: 3, damageMax: 8 },
    requirements: { level: 3, rankId: "sargento" },
    tags: ["veteran", "blade"],
  }));
  items.push(newItem({
    id: "weapon_tizona_001",
    name: "Tizona de la compañía",
    slot: "weapon", type: "sword", tier: 4, price: 560,
    assetId: "asset_sword_veteran_001", footprint: { w: 1, h: 2 },
    description: "Hoja con nombre, vaina de cuero repujado. Pide respeto.",
    stats: { ...emptyStats(), sword: 4, discipline: 1, damageMin: 4, damageMax: 9 },
    requirements: { level: 4, rankId: "alferez" },
    passives: [{ id: "sangre_barro", label: "Sangre y barro", description: "+1 vigor al matar (2 turnos)." }],
    tags: ["named", "blade", "masterwork"],
  }));
  items.push(newItem({
    id: "weapon_maestre_001",
    name: "Espada del maestre",
    slot: "weapon", type: "sword", tier: 4, price: 680,
    assetId: "asset_sword_masterwork_001", footprint: { w: 1, h: 2 },
    description: "Hoja de Toledo, mango de marfil. Pesa como una orden.",
    stats: { ...emptyStats(), sword: 4, command: 2, damageMin: 5, damageMax: 10 },
    requirements: { level: 4, rankId: "capitan" },
    passives: [{ id: "mirada_maestre", label: "Mirada del maestre", description: "+2 mando." }],
    tags: ["masterwork", "blade", "captain"],
  }));

  // ---------------------------------------------------------------------------
  // WEAPONS: ARQUEBUSES (8)
  // ---------------------------------------------------------------------------
  items.push(newItem({
    id: "weapon_arcabuz_bisono_001",
    name: "Arcabuz de bisoño",
    slot: "weapon", type: "arquebus", tier: 1, price: 22,
    assetId: "asset_arquebus_common_001", footprint: { w: 1, h: 3 },
    description: "Mechero y llave lentos. Dispara más por inercia que por puntería.",
    stats: { ...emptyStats(), arquebus: 2, damageMin: 2, damageMax: 6 },
    tags: ["early", "firearm"],
  }));
  items.push(newItem({
    id: "weapon_mosquete_001",
    name: "Mosquete bisoño",
    slot: "weapon", type: "arquebus", tier: 1, price: 28,
    assetId: "asset_arquebus_common_002", footprint: { w: 1, h: 3 },
    description: "Culata agrietada, dispara igual.",
    stats: { ...emptyStats(), arquebus: 2, damageMin: 2, damageMax: 7 },
    tags: ["early", "firearm"],
  }));
  items.push(newItem({
    id: "weapon_mecha_001",
    name: "Arcabuz de mecha",
    slot: "weapon", type: "arquebus", tier: 2, price: 95,
    assetId: "asset_arquebus_uncommon_001", footprint: { w: 1, h: 3 },
    description: "Mechero fiable, llave engrasada. Recarga sin jurar.",
    stats: { ...emptyStats(), arquebus: 3, cunning: 1, damageMin: 3, damageMax: 8 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "firearm"],
  }));
  items.push(newItem({
    id: "weapon_curena_001",
    name: "Arcabuz con cureña",
    slot: "weapon", type: "arquebus", tier: 2, price: 120,
    assetId: "asset_arquebus_uncommon_002", footprint: { w: 1, h: 3 },
    description: "Cureña corta, mejor apoyo para el tiro.",
    stats: { ...emptyStats(), arquebus: 3, discipline: 1, damageMin: 3, damageMax: 9 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "firearm"],
  }));
  items.push(newItem({
    id: "weapon_rueda_001",
    name: "Mosquete de rueda",
    slot: "weapon", type: "arquebus", tier: 3, price: 250,
    assetId: "asset_arquebus_rare_001", footprint: { w: 1, h: 3 },
    description: "Llave de rueda, enciende bajo la lluvia.",
    stats: { ...emptyStats(), arquebus: 4, cunning: 1, damageMin: 4, damageMax: 10 },
    requirements: { level: 3, rankId: "cabo_de_escuadra" },
    passives: [{ id: "tiro_certero", label: "Tiro certero", description: "+1 arcabuz, mejor en niebla." }],
    tags: ["firearm", "officer"],
  }));
  items.push(newItem({
    id: "weapon_piston_001",
    name: "Arcabuz de pistón",
    slot: "weapon", type: "arquebus", tier: 3, price: 290,
    assetId: "asset_arquebus_rare_002", footprint: { w: 1, h: 3 },
    description: "Pistón fiable, mira de hierro.",
    stats: { ...emptyStats(), arquebus: 4, cunning: 1, damageMin: 4, damageMax: 11 },
    requirements: { level: 3, rankId: "sargento" },
    tags: ["firearm", "officer"],
  }));
  items.push(newItem({
    id: "weapon_maestro_tirador_001",
    name: "Mosquete de tirador",
    slot: "weapon", type: "arquebus", tier: 4, price: 580,
    assetId: "asset_arquebus_veteran_001", footprint: { w: 1, h: 3 },
    description: "Madera de nogal, mira larga. Del maestro tirador.",
    stats: { ...emptyStats(), arquebus: 5, cunning: 2, damageMin: 5, damageMax: 12 },
    requirements: { level: 4, rankId: "alferez" },
    passives: [{ id: "tiro_largo", label: "Tiro largo", description: "+2 arcabuz en línea abierta." }],
    tags: ["firearm", "masterwork"],
  }));
  items.push(newItem({
    id: "weapon_asedio_001",
    name: "Mosquete de asedio",
    slot: "weapon", type: "arquebus", tier: 4, price: 700,
    assetId: "asset_arquebus_masterwork_001", footprint: { w: 2, h: 3 },
    description: "Cañón pesado, recargado con dos hombres. Muro o carne.",
    stats: { ...emptyStats(), arquebus: 6, vigor: -1, damageMin: 7, damageMax: 14 },
    requirements: { level: 4, rankId: "capitan" },
    passives: [{ id: "rompe_muros", label: "Rompe muros", description: "Ignora 2 puntos de armadura." }],
    tags: ["firearm", "siege", "masterwork"],
  }));

  // ---------------------------------------------------------------------------
  // ARMOR: HELMETS (10)
  // ---------------------------------------------------------------------------
  const helmetNames = [
    "Morrion abollado", "Morrion con remaches", "Morrion oxidado",
    "Morrion bruñido", "Morrion con cresta",
  ];
  const helmetDescs = [
    "Abollado por un golpe de pica.",
    "Remaches de bronce, golpea la lluvia.",
    "Óxido antiguo, pero protege la cabeza.",
    "Bruñido, mejor para revista.",
    "Cresta alta, visible en línea.",
  ];
  for (let i = 0; i < 5; i++) {
    const tier = i < 3 ? 1 : 2;
    const assetKey = i < 3
      ? `asset_morion_common_00${i + 1}`
      : `asset_morion_uncommon_00${i - 1}`;
    items.push(newItem({
      id: `helmet_morion_${String(i + 1).padStart(3, "0")}`,
      name: helmetNames[i],
      slot: "helmet", type: "armor", tier, price: tierPrice(tier, 0.9 + i * 0.15),
      assetId: assetKey,
      footprint: { w: 1, h: 1 },
      description: helmetDescs[i],
      stats: { ...emptyStats(), armor: tier === 1 ? 1 : 2, discipline: tier === 1 ? 0 : 1 },
      requirements: { level: tier, rankId: tier === 1 ? "bisono" : "soldado" },
      tags: tier === 1 ? ["early", "helmet"] : ["standard", "helmet"],
    }));
  }
  const vetHelmets = [
    { name: "Morrion estriado", desc: "Acero estriado, buena protección." },
    { name: "Morrion flor de bronce", desc: "Flor de bronce repujada." },
    { name: "Celada con visor", desc: "Celada cerrada con visor, sólo para oficiales." },
  ];
  for (let i = 0; i < 3; i++) {
    items.push(newItem({
      id: `helmet_morion_v_${String(i + 1).padStart(3, "0")}`,
      name: vetHelmets[i].name,
      slot: "helmet", type: "armor", tier: 3, price: tierPrice(3, 1.0 + i * 0.2),
      assetId: i < 2 ? `asset_morion_rare_00${i + 1}` : "asset_celada_001",
      footprint: { w: 1, h: 1 },
      description: vetHelmets[i].desc,
      stats: { ...emptyStats(), armor: 3, discipline: 1, command: i === 2 ? 1 : 0 },
      requirements: { level: 3, rankId: i === 2 ? "sargento" : "cabo_de_escuadra" },
      tags: i === 2 ? ["officer", "helmet", "veteran"] : ["officer", "helmet"],
    }));
  }
  items.push(newItem({
    id: "helmet_morion_master_001",
    name: "Morrion dorado del capitán",
    slot: "helmet", type: "armor", tier: 4, price: 720,
    assetId: "asset_morion_masterwork_001", footprint: { w: 1, h: 1 },
    description: "Morrion dorado, fleurs-de-lis grabadas. Capitán de compañía.",
    stats: { ...emptyStats(), armor: 4, discipline: 2, command: 2 },
    requirements: { level: 4, rankId: "capitan" },
    passives: [{ id: "mando_visible", label: "Mando visible", description: "+2 mando en formación." }],
    tags: ["captain", "helmet", "masterwork"],
  }));

  // ---------------------------------------------------------------------------
  // ARMOR: CUIRASSES (10)
  // ---------------------------------------------------------------------------
  const cuirassNames = [
    "Coselete abollado", "Peto oxidado", "Coselete de bisoño",
    "Coselete bruñido", "Brigantina oscura",
  ];
  const cuirassDescs = [
    "Marcas de impacto del último combate.",
    "Óxido antiguo, todavía protege.",
    "Coselete básico de bisoño.",
    "Bruñido a medias.",
    "Brigantina de placas remachadas.",
  ];
  for (let i = 0; i < 5; i++) {
    const tier = i < 3 ? 1 : 2;
    const assetKey = i < 3
      ? `asset_cuirass_common_00${i + 1}`
      : `asset_cuirass_uncommon_00${i - 1}`;
    items.push(newItem({
      id: `chest_cuirass_${String(i + 1).padStart(3, "0")}`,
      name: cuirassNames[i],
      slot: "chest", type: "armor", tier, price: tierPrice(tier, 1.2 + i * 0.3),
      assetId: assetKey,
      footprint: { w: 2, h: 2 },
      description: cuirassDescs[i],
      stats: { ...emptyStats(), armor: tier === 1 ? 2 : 3, vigor: tier === 1 ? 0 : 1 },
      requirements: { level: tier, rankId: tier === 1 ? "bisono" : "soldado" },
      tags: tier === 1 ? ["early", "armor"] : ["standard", "armor"],
    }));
  }
  const rareCuirasses = [
    { name: "Coselete estriado", desc: "Acero estriado, oficial veterano." },
    { name: "Coselete con santo", desc: "Santo grabado en el pecho." },
    { name: "Peto del alférez", desc: "Peto de alférez, brilla en revista." },
  ];
  for (let i = 0; i < 3; i++) {
    items.push(newItem({
      id: `chest_cuirass_rare_${String(i + 1).padStart(3, "0")}`,
      name: rareCuirasses[i].name,
      slot: "chest", type: "armor", tier: 3, price: tierPrice(3, 1.4 + i * 0.3),
      assetId: `asset_cuirass_rare_00${i + 1}`,
      footprint: { w: 2, h: 2 },
      description: rareCuirasses[i].desc,
      stats: { ...emptyStats(), armor: 4, vigor: 1, command: 1 },
      requirements: { level: 3, rankId: i === 2 ? "sargento" : "cabo_de_escuadra" },
      tags: ["officer", "armor"],
    }));
  }
  items.push(newItem({
    id: "chest_cuirass_veteran_001",
    name: "Coselete de la Vieja Guardia",
    slot: "chest", type: "armor", tier: 4, price: 620,
    assetId: "asset_cuirass_veteran_001", footprint: { w: 2, h: 2 },
    description: "Coselete martillado, latón incrustado. De la Vieja Guardia.",
    stats: { ...emptyStats(), armor: 6, vigor: 2, discipline: 1 },
    requirements: { level: 4, rankId: "alferez" },
    passives: [{ id: "aguante_guardia", label: "Aguante de la guardia", description: "+1 disciplina en línea." }],
    tags: ["armor", "veteran", "masterwork"],
  }));
  items.push(newItem({
    id: "chest_cuirass_master_001",
    name: "Coselete del maestre de campo",
    slot: "chest", type: "armor", tier: 4, price: 820,
    assetId: "asset_cuirass_masterwork_001", footprint: { w: 2, h: 2 },
    description: "Coselete dorado, cruz de Santiago. Pesa como una orden.",
    stats: { ...emptyStats(), armor: 7, vigor: 2, command: 3, honor: 1 },
    requirements: { level: 4, rankId: "maestre_de_campo" },
    passives: [{ id: "estandarte_vivo", label: "Estandarte vivo", description: "+3 mando pasivo." }],
    tags: ["armor", "masterwork", "command"],
  }));

  // ---------------------------------------------------------------------------
  // ARMOR: GAMBESONS (6)
  // ---------------------------------------------------------------------------
  const gambesons = [
    { name: "Jubón crudo", desc: "Acolchado crudo, huele a cuadra." },
    { name: "Gambesón de lino", desc: "Lino doble, mejor que nada." },
    { name: "Jubón de soldado", desc: "Jubón de soldado, usado." },
  ];
  for (let i = 0; i < 2; i++) {
    items.push(newItem({
      id: `chest_gambeson_${String(i + 1).padStart(3, "0")}`,
      name: gambesons[i].name,
      slot: "chest", type: "armor", tier: 1, price: 16 + i * 4,
      assetId: `asset_gambeson_common_00${i + 1}`,
      footprint: { w: 2, h: 2 },
      description: gambesons[i].desc,
      stats: { ...emptyStats(), armor: 1, vigor: i === 2 ? 1 : 0 },
      tags: ["early", "armor", "light"],
    }));
  }
  const gambesonsU = [
    { name: "Gambesón marrón", desc: "Lana marrón, cinturón de cuero." },
    { name: "Gambesón rojo", desc: "Rojo con botones de bronce." },
  ];
  for (let i = 0; i < 2; i++) {
    items.push(newItem({
      id: `chest_gambeson_u_${String(i + 1).padStart(3, "0")}`,
      name: gambesonsU[i].name,
      slot: "chest", type: "armor", tier: 2, price: 65 + i * 15,
      assetId: i === 0 ? "asset_gambeson_uncommon_001" : "asset_gambeson_rare_001",
      footprint: { w: 2, h: 2 },
      description: gambesonsU[i].desc,
      stats: { ...emptyStats(), armor: 2, discipline: 1, vigor: 1 },
      requirements: { level: 2, rankId: "soldado" },
      tags: ["standard", "armor"],
    }));
  }
  items.push(newItem({
    id: "chest_gambeson_v_001",
    name: "Gambesón de oficial",
    slot: "chest", type: "armor", tier: 4, price: 540,
    assetId: "asset_gambeson_veteran_001", footprint: { w: 2, h: 2 },
    description: "Gambesón azul con ribete dorado. Marca al oficial en la línea.",
    stats: { ...emptyStats(), armor: 4, command: 1, discipline: 1 },
    requirements: { level: 4, rankId: "alferez" },
    tags: ["officer", "armor", "masterwork"],
  }));

  // ---------------------------------------------------------------------------
  // BOOTS (6)
  // ---------------------------------------------------------------------------
  const bootsCommon = [
    { name: "Botas embarradas", desc: "Botas llenas de barro." },
    { name: "Botas rotas", desc: "Hebilla rota." },
    { name: "Botas viejas", desc: "Gastadas, mejor que descalzo." },
  ];
  for (let i = 0; i < 3; i++) {
    items.push(newItem({
      id: `boots_${String(i + 1).padStart(3, "0")}`,
      name: bootsCommon[i].name,
      slot: "boots", type: "armor", tier: 1, price: 10 + i * 3,
      assetId: i < 2 ? "asset_boots_common_001" : "asset_boots_common_002",
      footprint: { w: 1, h: 1 },
      description: bootsCommon[i].desc,
      stats: { ...emptyStats(), armor: 1 },
      tags: ["early", "boots"],
    }));
  }
  items.push(newItem({
    id: "boots_official_001",
    name: "Botas de oficial",
    slot: "boots", type: "armor", tier: 2, price: 65,
    assetId: "asset_boots_uncommon_001", footprint: { w: 1, h: 1 },
    description: "Botas altas de cuero, no se hunden en el barro.",
    stats: { ...emptyStats(), armor: 2, vigor: 1, command: 1 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "boots"],
  }));
  items.push(newItem({
    id: "boots_rare_001",
    name: "Botas bruñidas",
    slot: "boots", type: "armor", tier: 3, price: 240,
    assetId: "asset_boots_rare_001", footprint: { w: 1, h: 1 },
    description: "Botas bruñidas con hebillas de latón.",
    stats: { ...emptyStats(), armor: 3, vigor: 1, command: 1 },
    requirements: { level: 3, rankId: "cabo_de_escuadra" },
    tags: ["officer", "boots"],
  }));
  items.push(newItem({
    id: "boots_master_001",
    name: "Botas del capitán",
    slot: "boots", type: "armor", tier: 4, price: 540,
    assetId: "asset_boots_masterwork_001", footprint: { w: 1, h: 1 },
    description: "Botas altas grabadas, se ven desde lejos.",
    stats: { ...emptyStats(), armor: 4, vigor: 2, command: 2 },
    requirements: { level: 4, rankId: "capitan" },
    tags: ["captain", "boots", "masterwork"],
  }));

  // ---------------------------------------------------------------------------
  // GLOVES (4)
  // ---------------------------------------------------------------------------
  items.push(newItem({
    id: "gloves_001",
    name: "Guantes de bisoño",
    slot: "gloves", type: "armor", tier: 1, price: 8,
    assetId: "asset_gloves_common_001", footprint: { w: 1, h: 1 },
    description: "Guantes de cuero, manchas de sangre vieja.",
    stats: emptyStats(),
    tags: ["early", "gloves"],
  }));
  items.push(newItem({
    id: "gloves_buff_001",
    name: "Guantes de peto",
    slot: "gloves", type: "armor", tier: 2, price: 55,
    assetId: "asset_gloves_uncommon_001", footprint: { w: 1, h: 1 },
    description: "Guantes de cuero con remaches de acero.",
    stats: { ...emptyStats(), armor: 1, sword: 1 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "gloves"],
  }));
  items.push(newItem({
    id: "gloves_gauntlet_001",
    name: "Guanteletes de oficial",
    slot: "gloves", type: "armor", tier: 3, price: 220,
    assetId: "asset_gloves_rare_001", footprint: { w: 1, h: 1 },
    description: "Guanteletes con dedos de acero.",
    stats: { ...emptyStats(), armor: 2, sword: 1, discipline: 1 },
    requirements: { level: 3, rankId: "cabo_de_escuadra" },
    tags: ["officer", "gloves"],
  }));
  items.push(newItem({
    id: "gloves_master_001",
    name: "Guanteletes grabados",
    slot: "gloves", type: "armor", tier: 4, price: 520,
    assetId: "asset_gloves_veteran_001", footprint: { w: 1, h: 1 },
    description: "Guanteletes con grabados de campaña. De veterano.",
    stats: { ...emptyStats(), armor: 3, sword: 2, discipline: 1 },
    requirements: { level: 4, rankId: "alferez" },
    tags: ["veteran", "gloves", "masterwork"],
  }));

  // ---------------------------------------------------------------------------
  // LEGS (3)
  // ---------------------------------------------------------------------------
  items.push(newItem({
    id: "legs_calzas_001",
    name: "Calzas de bisoño",
    slot: "legs", type: "armor", tier: 1, price: 6,
    assetId: "asset_material_cloth_001", footprint: { w: 1, h: 2 },
    description: "Calzas de lana, remendadas.",
    stats: { ...emptyStats(), armor: 1 },
    tags: ["early", "legs"],
  }));
  items.push(newItem({
    id: "legs_mallas_001",
    name: "Mallas de infante",
    slot: "legs", type: "armor", tier: 2, price: 70,
    assetId: "asset_material_leather_001", footprint: { w: 1, h: 2 },
    description: "Mallas de anilla, las justas.",
    stats: { ...emptyStats(), armor: 2, vigor: 1 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "legs"],
  }));
  items.push(newItem({
    id: "legs_cuero_001",
    name: "Musleras de cuero",
    slot: "legs", type: "armor", tier: 3, price: 230,
    assetId: "asset_material_leather_001", footprint: { w: 1, h: 2 },
    description: "Musleras de cuero endurecido.",
    stats: { ...emptyStats(), armor: 3, vigor: 1 },
    requirements: { level: 3, rankId: "cabo_de_escuadra" },
    tags: ["officer", "legs"],
  }));

  // ---------------------------------------------------------------------------
  // CONSUMABLES (12)
  // ---------------------------------------------------------------------------
  const consumables = [
    { id: "consumable_pan_duro_001", name: "Pan de munición", desc: "Galleta dura como la vergüenza. Para no morir de hambre.", stat: { vigor: 1 }, price: 4, asset: "asset_consumable_bread_001" },
    { id: "consumable_salazon_001", name: "Salazón de carne", desc: "Carne salada, sabe a cuero. Aguanta una marcha.", stat: { vigor: 2 }, price: 6, asset: "asset_consumable_bread_001" },
    { id: "consumable_vino_001", name: "Bota de vino", desc: "Vino agrio, mejor que agua de foso.", stat: { vigor: 1, discipline: 1 }, price: 7, asset: "asset_consumable_wine_001" },
    { id: "consumable_aguardiente_001", name: "Aguardiente", desc: "Aguardiente de anisado. Quema por dentro.", stat: { discipline: 1 }, price: 8, asset: "asset_consumable_wine_001" },
    { id: "consumable_vendas_001", name: "Vendas de lino", desc: "Vendas limpias. Tratan cortes superficiales.", stat: { vigor: 1 }, price: 10, asset: "asset_consumable_bandage_001", treat: "wound_corte_mano_001" },
    { id: "consumable_unguento_001", name: "Ungüento de soldado", desc: "Ungüento grasiento, huele a caballo. Cierra heridas.", stat: { vigor: 2 }, price: 14, asset: "asset_consumable_ointment_001", treat: "wound_quemadura_001" },
    { id: "consumable_polvora_seca_001", name: "Pólvora seca", desc: "Pólvora en saquito de cuero. Carga para arcabuz.", stat: { arquebus: 1 }, price: 9, asset: "asset_consumable_powder_001" },
    { id: "consumable_plomo_001", name: "Plomo en bolsa", desc: "Bolsa con balas de plomo. Para el arcabuz.", stat: { arquebus: 1 }, price: 6, asset: "asset_consumable_lead_001" },
    { id: "consumable_mecha_001", name: "Mecha de repuesto", desc: "Cuerda de mecha enrollada. Prende fiable.", stat: { arquebus: 1 }, price: 5, asset: "asset_consumable_match_001" },
    { id: "consumable_piedra_001", name: "Piedra de mechero", desc: "Pedernal para el gatillo. Chispa corta.", stat: { arquebus: 1 }, price: 4, asset: "asset_consumable_match_001" },
    { id: "consumable_aceite_001", name: "Aceite de armas", desc: "Aceite para engrasar el arma. Huele a rancio.", stat: { sword: 1 }, price: 5, asset: "asset_consumable_ointment_001" },
    { id: "consumable_aguja_001", name: "Aguja e hilo", desc: "Aguja de hueso y hilo encerado. Cierra un roto.", stat: { vigor: 1 }, price: 6, asset: "asset_consumable_needle_001", treat: "wound_corte_mano_001" },
  ];
  // Use specific type per consumable category
  const consumableTypeMap = {
    consumable_pan_duro_001: "food",
    consumable_salazon_001: "food",
    consumable_vino_001: "food",
    consumable_aguardiente_001: "food",
    consumable_vendas_001: "medicine",
    consumable_unguento_001: "medicine",
    consumable_polvora_seca_001: "tool",
    consumable_plomo_001: "tool",
    consumable_mecha_001: "tool",
    consumable_piedra_001: "tool",
    consumable_aceite_001: "tool",
    consumable_aguja_001: "tool",
  };
  for (const c of consumables) {
    items.push(newItem({
      id: c.id, name: c.name, slot: "consumable", type: consumableTypeMap[c.id] ?? "misc", tier: 1, price: c.price,
      assetId: c.asset,
      footprint: { w: 1, h: 1 },
      description: c.desc,
      stats: { ...emptyStats(), ...c.stat },
      tags: ["consumable"],
      passives: c.treat ? [{ id: "tratamiento", label: "Tratamiento", description: `Trata ${c.treat}.` }] : [],
    }));
  }

  // ---------------------------------------------------------------------------
  // MATERIALS (8)
  // ---------------------------------------------------------------------------
  const materials = [
    { id: "material_tela_sucia_001", name: "Tela sucia", desc: "Trapo de lino sucio. Sirve para vendar.", price: 3, asset: "asset_material_cloth_001" },
    { id: "material_hebilla_001", name: "Hebilla rota", desc: "Hebilla de latón, rota. Pieza de recambio.", price: 4, asset: "asset_material_buckle_001" },
    { id: "material_cuero_duro_001", name: "Cuero duro", desc: "Cuero endurecido. Para correas y suelas.", price: 6, asset: "asset_material_leather_001" },
    { id: "material_polvora_humeda_001", name: "Pólvora húmeda", desc: "Pólvora arruinada por la lluvia. Apenas prende.", price: 2, asset: "asset_material_powder_001" },
    { id: "material_plomo_001", name: "Plomo de fundir", desc: "Trozo de plomo. Se funde para balas.", price: 4, asset: "asset_material_lead_001" },
    { id: "material_astilla_001", name: "Astilla de pica", desc: "Trozo roto de una pica. Apenas vale.", price: 1, asset: "asset_material_splinter_001" },
    { id: "material_tablilla_001", name: "Tablilla de madera", desc: "Tabla de pino. Para entablillar.", price: 3, asset: "asset_material_splinter_001" },
    { id: "material_cuerda_001", name: "Cuerda de cáñamo", desc: "Cuerda de cáñamo, húmeda. Sirve para todo.", price: 4, asset: "asset_material_splinter_001" },
  ];
  // Materials use "tool" or "misc" for type
  const materialTypeMap = {
    material_tela_sucia_001: "tool",
    material_hebilla_001: "tool",
    material_cuero_duro_001: "tool",
    material_polvora_humeda_001: "tool",
    material_plomo_001: "tool",
    material_astilla_001: "tool",
    material_tablilla_001: "tool",
    material_cuerda_001: "tool",
  };
  for (const m of materials) {
    items.push(newItem({
      id: m.id, name: m.name, slot: "material", type: materialTypeMap[m.id] ?? "misc", tier: 1, price: m.price,
      assetId: m.asset,
      footprint: { w: 1, h: 1 },
      description: m.desc,
      stats: emptyStats(),
      tags: ["material"],
    }));
  }

  // ---------------------------------------------------------------------------
  // RELIGIOUS (4)
  // ---------------------------------------------------------------------------
  const religious = [
    { id: "religious_rosario_001", name: "Rosario de cuentas", desc: "Cuentas de madera, gastadas por rezos.", price: 8, stat: { discipline: 1 }, asset: "asset_religious_rosary_001" },
    { id: "religious_relicario_001", name: "Relicario dudoso", desc: "Relicario de metal barato. Dicen que es de Santiago.", price: 25, stat: { honor: 1, discipline: 1 }, asset: "asset_religious_relic_001" },
    { id: "religious_medalla_001", name: "Medalla de Santiago", desc: "Medalla de latón, pesada. Cuelga del cuello.", price: 18, stat: { honor: 1 }, asset: "asset_religious_medal_001" },
    { id: "religious_cruz_001", name: "Cruz de hierro", desc: "Cruz de hierro, basta. La lleva el soldado.", price: 5, stat: { discipline: 1 }, asset: "asset_religious_cross_001" },
  ];
  for (const r of religious) {
    items.push(newItem({
      id: r.id, name: r.name, slot: "trinket", type: "religious", tier: 1, price: r.price,
      assetId: r.asset,
      footprint: { w: 1, h: 1 },
      description: r.desc,
      stats: { ...emptyStats(), ...r.stat },
      tags: ["religious", "trinket"],
    }));
  }

  // ---------------------------------------------------------------------------
  // TRINKETS (3)
  // ---------------------------------------------------------------------------
  const trinkets = [
    { id: "trinket_mapa_001", name: "Mapa de Flandes", desc: "Mapa dibujado a mano, manchas de barro.", price: 35, stat: { cunning: 1 }, asset: "asset_trinket_map_001" },
    { id: "trinket_carta_001", name: "Carta del hogar", desc: "Carta arrugada, hace meses que no llega correo.", price: 8, stat: { discipline: 1 }, asset: "asset_trinket_letter_001" },
    { id: "trinket_moneda_001", name: "Moneda de plata", desc: "Moneda de plata gastada. Apenas vale para un pan.", price: 5, stat: {}, asset: "asset_trinket_coin_001" },
  ];
  for (const t of trinkets) {
    items.push(newItem({
      id: t.id, name: t.name, slot: "trinket", type: "coin", tier: 1, price: t.price,
      assetId: t.asset,
      footprint: { w: 1, h: 1 },
      description: t.desc,
      stats: { ...emptyStats(), ...t.stat },
      tags: ["trinket"],
    }));
  }

  // ---------------------------------------------------------------------------
  // COIN (special, currency)
  // ---------------------------------------------------------------------------
  items.push(newItem({
    id: "consumable_moneda_001",
    name: "Moneda de plata",
    slot: "material", type: "coin", tier: 1, price: 1,
    assetId: "asset_trinket_coin_001", footprint: { w: 1, h: 1 },
    description: "Moneda de plata. La pagas tú, te la pagan, te la roban.",
    stats: emptyStats(),
    tags: ["currency"],
  }));
  // Extra consumable to bump count
  items.push(newItem({
    id: "consumable_agua_bota_001",
    name: "Bota de agua",
    slot: "consumable", type: "food", tier: 1, price: 3,
    assetId: "asset_consumable_wine_001", footprint: { w: 1, h: 1 },
    description: "Bota con agua, sabe a cuero. Quita la sed, no el hambre.",
    stats: { ...emptyStats(), vigor: 1 },
    tags: ["consumable", "early"],
  }));
  items.push(newItem({
    id: "consumable_pan_molde_001",
    name: "Pan de molde",
    slot: "consumable", type: "food", tier: 2, price: 8,
    assetId: "asset_consumable_bread_001", footprint: { w: 1, h: 1 },
    description: "Pan de molde, mejor que el de munición.",
    stats: { ...emptyStats(), vigor: 2, discipline: 1 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["consumable", "standard"],
  }));
  items.push(newItem({
    id: "consumable_queso_001",
    name: "Queso curado",
    slot: "consumable", type: "food", tier: 2, price: 10,
    assetId: "asset_consumable_bread_001", footprint: { w: 1, h: 1 },
    description: "Queso curado de la aldea. Huele fuerte, sabe mejor.",
    stats: { ...emptyStats(), vigor: 2, discipline: 1 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["consumable", "standard"],
  }));
  // Trinkets extra
  items.push(newItem({
    id: "trinket_daga_001",
    name: "Daga de respeto",
    slot: "trinket", type: "misc", tier: 1, price: 25,
    assetId: "asset_sword_common_002", footprint: { w: 1, h: 1 },
    description: "Daga fina, herencia de un tío lejano.",
    stats: { ...emptyStats(), sword: 1, honor: 1 },
    tags: ["trinket", "blade"],
  }));
  items.push(newItem({
    id: "trinket_anillo_001",
    name: "Anillo de plata",
    slot: "trinket", type: "coin", tier: 1, price: 18,
    assetId: "asset_trinket_coin_001", footprint: { w: 1, h: 1 },
    description: "Anillo de plata, sin blasón. Lo lleva un muerto.",
    stats: { ...emptyStats(), honor: 1 },
    tags: ["trinket"],
  }));
  // Extra legs
  items.push(newItem({
    id: "legs_mallas_reforzadas_001",
    name: "Mallas reforzadas",
    slot: "legs", type: "armor", tier: 3, price: 280,
    assetId: "asset_material_leather_001", footprint: { w: 1, h: 2 },
    description: "Mallas reforzadas con badana, aguantan una carga.",
    stats: { ...emptyStats(), armor: 4, vigor: 1 },
    requirements: { level: 3, rankId: "cabo_de_escuadra" },
    tags: ["officer", "legs"],
  }));
  items.push(newItem({
    id: "legs_cuero_master_001",
    name: "Musleras del capitán",
    slot: "legs", type: "armor", tier: 4, price: 520,
    assetId: "asset_material_leather_001", footprint: { w: 1, h: 2 },
    description: "Musleras grabadas del capitán. Mejor defensa que la mayoría.",
    stats: { ...emptyStats(), armor: 5, vigor: 2, command: 1 },
    requirements: { level: 4, rankId: "capitan" },
    tags: ["captain", "legs", "masterwork"],
  }));
  // Helmet masterwork extra
  items.push(newItem({
    id: "helmet_celada_master_001",
    name: "Celada del maestre",
    slot: "helmet", type: "armor", tier: 4, price: 760,
    assetId: "asset_celada_001", footprint: { w: 1, h: 1 },
    description: "Celada dorada, visor de bisagra. La lleva el maestre.",
    stats: { ...emptyStats(), armor: 5, discipline: 2, command: 3 },
    requirements: { level: 4, rankId: "maestre_de_campo" },
    passives: [{ id: "mando_absoluto", label: "Mando absoluto", description: "+3 mando en línea." }],
    tags: ["maestre", "helmet", "masterwork"],
  }));
  // Gambeson extra
  items.push(newItem({
    id: "chest_gambeson_master_001",
    name: "Gambesón del maestre",
    slot: "chest", type: "armor", tier: 4, price: 720,
    assetId: "asset_gambeson_masterwork_001", footprint: { w: 2, h: 2 },
    description: "Gambesón bordado en oro, marca al maestre en la línea.",
    stats: { ...emptyStats(), armor: 5, command: 2, discipline: 2 },
    requirements: { level: 4, rankId: "maestre_de_campo" },
    tags: ["maestre", "armor", "masterwork"],
  }));
  // Sword tier 2 extras
  items.push(newItem({
    id: "weapon_espada_ancha_001",
    name: "Espada ancha de infante",
    slot: "weapon", type: "sword", tier: 2, price: 85,
    assetId: "asset_sword_uncommon_002", footprint: { w: 1, h: 2 },
    description: "Hoja ancha, gavilanes rectos. Sirve para partir.",
    stats: { ...emptyStats(), sword: 2, discipline: 1, damageMin: 2, damageMax: 5 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "blade"],
  }));
  // Pike tier 1 extra
  items.push(newItem({
    id: "weapon_pica_enebro_001",
    name: "Pica de enebro",
    slot: "weapon", type: "pike", tier: 1, price: 12,
    assetId: "asset_pike_common_001", footprint: { w: 1, h: 3 },
    description: "Pica de enebro barato. La madera cruje con la lluvia.",
    stats: { ...emptyStats(), pike: 1, damageMin: 1, damageMax: 3 },
    tags: ["early", "poor", "pike"],
  }));
  // Arquebus extras
  items.push(newItem({
    id: "weapon_arcabuz_italiano_001",
    name: "Arcabuz italiano",
    slot: "weapon", type: "arquebus", tier: 3, price: 280,
    assetId: "asset_arquebus_uncommon_002", footprint: { w: 1, h: 3 },
    description: "Arcabuz de marca italiana. Más fiable, más caro.",
    stats: { ...emptyStats(), arquebus: 4, cunning: 1, damageMin: 4, damageMax: 10 },
    requirements: { level: 3, rankId: "sargento" },
    tags: ["firearm", "italy", "officer"],
  }));
  // Helmet extras
  items.push(newItem({
    id: "helmet_morion_v_004",
    name: "Morrion con penacho",
    slot: "helmet", type: "armor", tier: 3, price: 280,
    assetId: "asset_morion_rare_002", footprint: { w: 1, h: 1 },
    description: "Morrion con penacho de capitán.",
    stats: { ...emptyStats(), armor: 3, command: 2, discipline: 1 },
    requirements: { level: 3, rankId: "sargento" },
    tags: ["officer", "helmet"],
  }));
  // Boots extras
  items.push(newItem({
    id: "boots_rare_002",
    name: "Botas de montar",
    slot: "boots", type: "armor", tier: 3, price: 250,
    assetId: "asset_boots_rare_001", footprint: { w: 1, h: 1 },
    description: "Botas de montar, caña alta.",
    stats: { ...emptyStats(), armor: 3, vigor: 1, command: 1 },
    requirements: { level: 3, rankId: "cabo_de_escuadra" },
    tags: ["officer", "boots", "cavalry"],
  }));
  // Trinket extra
  items.push(newItem({
    id: "trinket_reliquia_001",
    name: "Reliquia de la capilla",
    slot: "trinket", type: "religious", tier: 2, price: 60,
    assetId: "asset_religious_relic_001", footprint: { w: 1, h: 1 },
    description: "Reliquia bendecida en la capilla del campo.",
    stats: { ...emptyStats(), honor: 1, discipline: 1 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["trinket", "religious"],
  }));
  // Material extras
  items.push(newItem({
    id: "material_piedra_muela_001",
    name: "Piedra de muela",
    slot: "material", type: "tool", tier: 1, price: 8,
    assetId: "asset_material_splinter_001", footprint: { w: 1, h: 1 },
    description: "Piedra de amolar el filo. La lleva el armero.",
    stats: emptyStats(),
    tags: ["material", "tool"],
  }));
  // Extra consumable: pólvora húmeda (matches old name)
  items.push(newItem({
    id: "consumable_polvora_humeda_001",
    name: "Pólvora húmeda (saquito)",
    slot: "consumable", type: "tool", tier: 1, price: 1,
    assetId: "asset_material_powder_001", footprint: { w: 1, h: 1 },
    description: "Saquito de pólvora arruinada por la lluvia. Apenas prende.",
    stats: emptyStats(),
    tags: ["consumable", "material"],
  }));
  // Extra consumable
  items.push(newItem({
    id: "consumable_botella_001",
    name: "Botella vacía",
    slot: "consumable", type: "tool", tier: 1, price: 2,
    assetId: "asset_consumable_wine_001", footprint: { w: 1, h: 1 },
    description: "Botella de vidrio, vacía. Sirve para vino, agua o desesperación.",
    stats: emptyStats(),
    tags: ["consumable", "tool"],
  }));
  // More items to reach 120+
  // Helmet extras
  items.push(newItem({
    id: "helmet_morion_sargento_001",
    name: "Morrion de sargento",
    slot: "helmet", type: "armor", tier: 3, price: 280,
    assetId: "asset_morion_rare_001", footprint: { w: 1, h: 1 },
    description: "Morrion de sargento, pliegue alto, buen temple.",
    stats: { ...emptyStats(), armor: 3, discipline: 2, command: 1 },
    requirements: { level: 3, rankId: "sargento" },
    tags: ["officer", "helmet"],
  }));
  // Cuirass extras
  items.push(newItem({
    id: "chest_peto_mercader_001",
    name: "Peto de mercader",
    slot: "chest", type: "armor", tier: 2, price: 80,
    assetId: "asset_cuirass_uncommon_002", footprint: { w: 2, h: 2 },
    description: "Peto ligerito, lo lleva el mercader de la escolta.",
    stats: { ...emptyStats(), armor: 2, vigor: 1, discipline: 1 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "armor", "light"],
  }));
  // Boots extras
  items.push(newItem({
    id: "boots_campana_001",
    name: "Botas de campana",
    slot: "boots", type: "armor", tier: 1, price: 14,
    assetId: "asset_boots_common_002", footprint: { w: 1, h: 1 },
    description: "Botas anchas de campana, de moda entre los tercios.",
    stats: { ...emptyStats(), armor: 1, discipline: 1 },
    tags: ["early", "boots"],
  }));
  // Trinket extras
  items.push(newItem({
    id: "trinket_bolsa_001",
    name: "Bolsa de suministros",
    slot: "trinket", type: "misc", tier: 1, price: 10,
    assetId: "asset_material_cloth_001", footprint: { w: 1, h: 1 },
    description: "Bolsa de tela con pan, vendas y un mendrugo. Suministros.",
    stats: { ...emptyStats(), discipline: 1 },
    tags: ["trinket", "supplies"],
  }));
  items.push(newItem({
    id: "trinket_colgante_001",
    name: "Colgante de la madre",
    slot: "trinket", type: "religious", tier: 1, price: 8,
    assetId: "asset_religious_cross_001", footprint: { w: 1, h: 1 },
    description: "Colgante que dio tu madre antes de la marcha. No se vende.",
    stats: { ...emptyStats(), discipline: 1, honor: 1 },
    tags: ["trinket", "religious"],
  }));
  // Sword extras
  items.push(newItem({
    id: "weapon_vizcaina_001",
    name: "Vizcaína",
    slot: "weapon", type: "sword", tier: 2, price: 110,
    assetId: "asset_sword_uncommon_001", footprint: { w: 1, h: 2 },
    description: "Espada vizcaína, hoja larga, mejor para estocada.",
    stats: { ...emptyStats(), sword: 2, cunning: 1, damageMin: 2, damageMax: 6 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "blade"],
  }));
  items.push(newItem({
    id: "weapon_alabarda_001",
    name: "Alabarda sencilla",
    slot: "weapon", type: "pike", tier: 2, price: 95,
    assetId: "asset_pike_uncommon_001", footprint: { w: 1, h: 3 },
    description: "Alabarda sencilla, media pica media hacha. Cuesta empuñar.",
    stats: { ...emptyStats(), pike: 2, sword: 1, damageMin: 2, damageMax: 6 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "polearm"],
  }));
  // Material extras
  items.push(newItem({
    id: "material_pergamino_001",
    name: "Pergamino en blanco",
    slot: "material", type: "tool", tier: 1, price: 3,
    assetId: "asset_trinket_letter_001", footprint: { w: 1, h: 1 },
    description: "Pergamino en blanco, para escribir una orden o un robo.",
    stats: emptyStats(),
    tags: ["material", "tool"],
  }));
  items.push(newItem({
    id: "material_tinta_001",
    name: "Tinta y pluma",
    slot: "material", type: "tool", tier: 1, price: 4,
    assetId: "asset_trinket_letter_001", footprint: { w: 1, h: 1 },
    description: "Tinta y pluma. La lleva el cabo de la escribanía.",
    stats: emptyStats(),
    tags: ["material", "tool"],
  }));
  // Gambeson extra
  items.push(newItem({
    id: "chest_jubon_piel_001",
    name: "Jubón de piel",
    slot: "chest", type: "armor", tier: 2, price: 90,
    assetId: "asset_gambeson_uncommon_001", footprint: { w: 2, h: 2 },
    description: "Jubón de piel vuelta. Mejor abrigo que el lino.",
    stats: { ...emptyStats(), armor: 2, vigor: 2 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "armor", "warm"],
  }));
  // Offhand extras
  items.push(newItem({
    id: "weapon_escudo_pequeno_001",
    name: "Broquel pequeño",
    slot: "offhand", type: "armor", tier: 1, price: 18,
    assetId: "asset_boots_common_001", footprint: { w: 1, h: 1 },
    description: "Broquel pequeño, de cuero y hierro. Aguanta un tajo.",
    stats: { ...emptyStats(), armor: 2, discipline: 1 },
    tags: ["early", "shield"],
  }));
  items.push(newItem({
    id: "weapon_daga_buena_001",
    name: "Daga de Mainz",
    slot: "offhand", type: "sword", tier: 2, price: 65,
    assetId: "asset_sword_uncommon_001", footprint: { w: 1, h: 1 },
    description: "Daga de Mainz, hoja fina. Buena para rasgar y parar.",
    stats: { ...emptyStats(), sword: 2, cunning: 1, damageMin: 2, damageMax: 4 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["standard", "blade", "offhand"],
  }));
  // Misc extra
  items.push(newItem({
    id: "trinket_gafas_001",
    name: "Gafas de arcabucero",
    slot: "trinket", type: "misc", tier: 2, price: 40,
    assetId: "asset_glasses_001", footprint: { w: 1, h: 1 },
    description: "Gafas de aumento, para el arcabucero de vista cansada.",
    stats: { ...emptyStats(), arquebus: 1, cunning: 1 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["trinket", "firearm"],
  }));
  // Trinket extra
  items.push(newItem({
    id: "trinket_reloj_001",
    name: "Reloj de bolsillo",
    slot: "trinket", type: "misc", tier: 3, price: 220,
    assetId: "asset_trinket_coin_001", footprint: { w: 1, h: 1 },
    description: "Reloj de bolsillo, lo lleva algún oficial de la intendencia.",
    stats: { ...emptyStats(), cunning: 2, discipline: 1 },
    requirements: { level: 3, rankId: "cabo_de_escuadra" },
    tags: ["trinket", "rare"],
  }));
  // Extra consumable
  items.push(newItem({
    id: "consumable_pasta_001",
    name: "Pasta de soldado",
    slot: "consumable", type: "food", tier: 2, price: 12,
    assetId: "asset_consumable_bread_001", footprint: { w: 1, h: 1 },
    description: "Pasta de harina y grasa. Calorías, no sabor.",
    stats: { ...emptyStats(), vigor: 2, discipline: 1 },
    requirements: { level: 2, rankId: "soldado" },
    tags: ["consumable", "food"],
  }));
  // Extra material
  items.push(newItem({
    id: "material_botin_001",
    name: "Botín sin valor",
    slot: "material", type: "misc", tier: 1, price: 2,
    assetId: "asset_material_cloth_001", footprint: { w: 1, h: 1 },
    description: "Botín sin valor, lo lleva el soldado a la línea.",
    stats: emptyStats(),
    tags: ["material", "loot"],
  }));

  return items;
}
