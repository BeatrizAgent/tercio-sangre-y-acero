#!/usr/bin/env node
// reportFragments.mjs — 80+ fragments across types: opening, attack, hit, miss, wound, loot, victory, defeat.

export function buildReportFragments() {
  const f = [];
  let n = 0;
  const id = (t) => `report_${t}_${String(++n).padStart(3, "0")}`;

  // ===========================================================================
  // OPENING (10)
  // ===========================================================================
  const openings = [
    { text: "El barro tragaba las botas cuando apareció el enemigo entre la niebla baja.", tags: ["road", "early"] },
    { text: "La lluvia se metía entre los moriones. Los hombres escupían al suelo antes de alinear.", tags: ["rain", "watch"] },
    { text: "Los carros de pólvora traqueteaban bajo la lona remendada. Cada bache era una sentencia.", tags: ["powder", "escort"] },
    { text: "El camino era barro hasta el tobillo. La compañía avanzó despacio, con las picas como ramas negras.", tags: ["mud", "patrol"] },
    { text: "El sol de Italia caía a plomo. Las armaduras quemaban al primer toque.", tags: ["italy", "hills"] },
    { text: "Los setos de Flandes chorreaban agua sucia. El enemigo esperaba al otro lado.", tags: ["flandes", "skirmish"] },
    { text: "La trinchera olía a pólvora quemada y a miedo viejo. Alguien rezó en voz baja.", tags: ["siege", "trench"] },
    { text: "El convoy arrancó con un chasquido de ejes. El polvo tardó en asentarse.", tags: ["convoy", "escort"] },
    { text: "La taberna del pueblo olía a vino agrio. La pelea empezó con una mirada.", tags: ["tavern", "duel"] },
    { text: "Los veteranos amotinados cerraron el portón del cofre. El sargento buscó tu mirada.", tags: ["mutiny", "camp", "pay"] },
  ];
  for (const o of openings) f.push({ id: id("opening"), type: "opening", text: o.text, tags: o.tags });

  // ===========================================================================
  // ATTACK (10)
  // ===========================================================================
  const attacks = [
    { text: "El sargento alzó la pica y la línea avanzó como un solo hierro.", tags: ["attack", "line"] },
    { text: "El arcabucero apuntó bajo, con la mecha humedeciéndose entre los dedos.", tags: ["firearm", "attack"] },
    { text: "El sargento gritó la orden y el peso de las picas cayó sobre el enemigo.", tags: ["pike", "attack"] },
    { text: "La carga de caballería rompió el silencio. La línea se cerró antes de que pasara.", tags: ["cavalry", "flandes"] },
    { text: "El emboscador eligió su momento. La chispa saltó cuando nadie esperaba.", tags: ["firearm", "ambush"] },
    { text: "Los piqueros italianos esperaron. Esperaron. Y al tercer paso, embistieron.", tags: ["pike", "italy"] },
    { text: "La andanada pasó por encima de la línea. Las mechas se apagaron en el barro.", tags: ["firearm", "volley"] },
    { text: "El flanco cedió un instante. El sargento lo cerró con tres voces y un puntapié.", tags: ["discipline", "attack"] },
    { text: "El caballero cargó con la lanza baja. La pica lo esperó.", tags: ["cavalry", "italy"] },
    { text: "El mercenario se rió. Después dejó de reírse.", tags: ["mercenary", "skirmish"] },
  ];
  for (const a of attacks) f.push({ id: id("attack"), type: "attack", text: a.text, tags: a.tags });

  // ===========================================================================
  // HIT (10)
  // ===========================================================================
  const hits = [
    { text: "La hoja entró con un chasquido húmedo. El hombre cayó sin ruido.", tags: ["hit", "blade"] },
    { text: "El tiro del arcabuz le dio en el pecho. Cayó como un saco de trigo.", tags: ["hit", "firearm"] },
    { text: "La punta de la pica se clavó en la unión de la coraza. El hombre se dobló.", tags: ["hit", "pike"] },
    { text: "El corte fue limpio. La sangre manchó el barro de un rojo oscuro.", tags: ["hit", "blade"] },
    { text: "La bala de plomo le atravesó el muslo. Se escuchó el golpe antes que el grito.", tags: ["hit", "firearm"] },
    { text: "El arcabuz tiró a la línea. Un recluta se llevó la peor parte.", tags: ["hit", "firearm", "early"] },
    { text: "La pica entró por la axila, donde la coraza no protege. Cayó sin un grito.", tags: ["hit", "pike"] },
    { text: "El mercenario recibió el tajo en el hombro. Soltó la espada.", tags: ["hit", "blade", "mercenary"] },
    { text: "El oficial perdió el morrión. La línea entendió que había caído.", tags: ["hit", "officer"] },
    { text: "La andanada cerró contra el seto. Tres hombres no se levantaron.", tags: ["hit", "volley", "flandes"] },
  ];
  for (const h of hits) f.push({ id: id("hit"), type: "hit", text: h.text, tags: h.tags });

  // ===========================================================================
  // MISS (10)
  // ===========================================================================
  const misses = [
    { text: "La pica pasó a un palmo del costado. El hombre se apartó demasiado tarde para tu bien.", tags: ["miss", "pike"] },
    { text: "El arcabuz hizo un chasquido seco. La mecha se apagó antes de tiempo.", tags: ["miss", "firearm"] },
    { text: "El tajo cortó el aire. El envés dio contra el morrión con un sonido a lata.", tags: ["miss", "blade"] },
    { text: "El disparo se perdió en la niebla. El arcabucero maldijo a su mecha.", tags: ["miss", "firearm"] },
    { text: "El soldado se escurrió entre las picas. La línea no se cerró a tiempo.", tags: ["miss", "line"] },
    { text: "El jinete se apartó de la línea. Tu pica dio contra el aire.", tags: ["miss", "cavalry"] },
    { text: "La ropera resbaló en la sangre ajena. El tajo no llegó.", tags: ["miss", "blade"] },
    { text: "El tiro del arcabuz pegó en el barro. El pólvora era mala.", tags: ["miss", "firearm", "powder"] },
    { text: "El mercenario esquivó el primer golpe. La línea entera lo vio.", tags: ["miss", "mercenary"] },
    { text: "La línea se movió. Tu disparo pasó entre dos hombres, sin herir a nadie.", tags: ["miss", "volley"] },
  ];
  for (const m of misses) f.push({ id: id("miss"), type: "miss", text: m.text, tags: m.tags });

  // ===========================================================================
  // WOUND (10)
  // ===========================================================================
  const wounds = [
    { text: "Un corte en la mano. Duele al empuñar, pero se puede seguir.", tags: ["wound", "minor"] },
    { text: "La bala le dio en el muslo. Arrastra la pierna al volver.", tags: ["wound", "serious"] },
    { text: "La pica entró en el hombro. Cuesta alzar el brazo.", tags: ["wound", "moderate"] },
    { text: "El golpe del morrión le zumbó en la cabeza. Se sentó en el barro.", tags: ["wound", "moderate"] },
    { text: "El balazo pasó rozando. La carne quemada olía a pólvora.", tags: ["wound", "moderate", "firearm"] },
    { text: "La costilla se rompió con un crujido. Respirar duele.", tags: ["wound", "serious"] },
    { text: "El desgarro del muslo le hará cojear semanas. La línea lo sabe.", tags: ["wound", "moderate"] },
    { text: "La quemadura en la mano derecha ennegreció la piel. Disparar, imposible.", tags: ["wound", "moderate", "firearm"] },
    { text: "La infección subió al día siguiente. Calor bajo la piel y miedo en las palabras.", tags: ["wound", "serious"] },
    { text: "El corte profundo se abría al moverse. La línea se abría con él.", tags: ["wound", "grave"] },
  ];
  for (const w of wounds) f.push({ id: id("wound"), type: "wound", text: w.text, tags: w.tags });

  // ===========================================================================
  // LOOT (10)
  // ===========================================================================
  const loot = [
    { text: "El cuerpo tenía una bolsa con monedas y un mendrugo.", tags: ["loot", "early"] },
    { text: "En el carro volcado había un barril de pólvora todavía seco.", tags: ["loot", "powder"] },
    { text: "La vaina del oficial guardaba doce doblones y un papel sellado.", tags: ["loot", "officer"] },
    { text: "Entre los muertos se encontró un morrión abollado y una daga con mango de hueso.", tags: ["loot", "early"] },
    { text: "El cofre de la carreta tenía harina, sal y un par de vendas usadas.", tags: ["loot", "convoy"] },
    { text: "El arcabucero muerto llevaba mechas y un saquito de plomo.", tags: ["loot", "firearm"] },
    { text: "El mercenario soltó una espada ancha y un relicario.", tags: ["loot", "mercenary"] },
    { text: "El oficial llevaba un mapa de Flandes. Manchado de barro, pero útil.", tags: ["loot", "recon"] },
    { text: "La tienda del baluarte guardaba comida, vendas y un odre de vino.", tags: ["loot", "siege"] },
    { text: "En la trinchera, bajo un cadáver, había un arcabuz de pistón y munición.", tags: ["loot", "siege", "firearm"] },
  ];
  for (const l of loot) f.push({ id: id("loot"), type: "loot", text: l.text, tags: l.tags });

  // ===========================================================================
  // VICTORY (10)
  // ===========================================================================
  const victories = [
    { text: "La línea resistió. El enemigo se retiró dejando los muertos en el barro.", tags: ["victory", "line"] },
    { text: "Mantuviste la formación y dejaste que el peso hiciera su trabajo. La compañía aguantó.", tags: ["victory", "discipline"] },
    { text: "El sargento gritó avance. El último enemigo se rindió en el seto.", tags: ["victory", "flandes"] },
    { text: "Los italianos se retiraron colina arriba. La línea se quedó con el botín.", tags: ["victory", "italy"] },
    { text: "El baluarte cayó al atardecer. La bandera del tercio ondeó entre el humo.", tags: ["victory", "siege", "flandes"] },
    { text: "El convoy llegó entero. Los conductores te miraron con respeto.", tags: ["victory", "convoy"] },
    { text: "El motín se deshizo. La tropa volvió al orden.", tags: ["victory", "mutiny", "camp"] },
    { text: "La emboscada se volvió contra el emboscador. La línea entera lo celebra.", tags: ["victory", "ambush"] },
    { text: "El capitán enemigo se rindió. Su espada pasa a tu cinto.", tags: ["victory", "boss"] },
    { text: "La trinchera resistió la noche. La tropa descansa con la línea cerrada.", tags: ["victory", "siege", "trench"] },
  ];
  for (const v of victories) f.push({ id: id("victory"), type: "victory", text: v.text, tags: v.tags });

  // ===========================================================================
  // DEFEAT (10)
  // ===========================================================================
  const defeats = [
    { text: "La línea cedió lo justo para recordar el miedo. La tropa se replegó.", tags: ["defeat", "line"] },
    { text: "El flanco se rompió. Tuvisteis que dejar el botín en el barro.", tags: ["defeat", "flank"] },
    { text: "La caballería os arrolló. El sargento contó cabezas bajo el árbol.", tags: ["defeat", "cavalry"] },
    { text: "La línea no aguantó el tercer asalto. La retirada fue ordenada y triste.", tags: ["defeat", "line"] },
    { text: "El baluarte no cayó. La compañía se retiró a la línea de partida.", tags: ["defeat", "siege"] },
    { text: "Los piqueros italianos cerraron la línea. La vuestra no se cerró a tiempo.", tags: ["defeat", "italy"] },
    { text: "El motín se llevó la mitad de la paga. La disciplina se resiente.", tags: ["defeat", "mutiny", "pay"] },
    { text: "La emboscada fue perfecta. Tuvisteis que abandonar el convoy.", tags: ["defeat", "ambush", "convoy"] },
    { text: "El jefe enemigo escapó. Vuelves con un tajo y sin la honra.", tags: ["defeat", "boss"] },
    { text: "La trinchera se inundó. La guardia se retiró al campamento.", tags: ["defeat", "trench"] },
  ];
  for (const d of defeats) f.push({ id: id("defeat"), type: "defeat", text: d.text, tags: d.tags });

  // ===========================================================================
  // REGIONAL: extra openings, hits, victories for variety
  // ===========================================================================
  // Italy-specific
  f.push({ id: id("opening"), type: "opening", text: "El camino subía entre viñedos. El calor hacía dudar hasta a las picas.", tags: ["italy", "heat"] });
  f.push({ id: id("opening"), type: "opening", text: "Las colinas italianas brillaban bajo el sol. El enemigo bajó desde la ermita.", tags: ["italy", "hills"] });
  f.push({ id: id("hit"), type: "hit", text: "La pica del italiano pasó la primera línea. La segunda respondió.", tags: ["hit", "italy", "pike"] });
  f.push({ id: id("victory"), type: "victory", text: "La línea italiana se rompió. La caballería enemiga huyó entre los olivos.", tags: ["victory", "italy"] });
  f.push({ id: id("loot"), type: "loot", text: "El oficial italiano dejó una espada de cazoleta y un saquito de especias.", tags: ["loot", "italy"] });

  // Flandes-specific
  f.push({ id: id("opening"), type: "opening", text: "El barro de Flandes tragaba las botas. La línea avanzó sin prisa.", tags: ["flandes", "mud"] });
  f.push({ id: id("opening"), type: "opening", text: "La niebla baja cubría los setos. El enemigo esperaba detrás.", tags: ["flandes", "fog"] });
  f.push({ id: id("hit"), type: "hit", text: "El disparo flamenco pasó a un palmo de la línea. La mecha de respuesta ardió.", tags: ["hit", "flandes", "firearm"] });
  f.push({ id: id("victory"), type: "victory", text: "El cruce cayó. La línea flamenca se rindió al fin del día.", tags: ["victory", "flandes"] });
  f.push({ id: id("defeat"), type: "defeat", text: "La trinchera flamenca resistió tres cargas. La vuestra se quedó a medio camino.", tags: ["defeat", "flandes", "trench"] });

  // Siege-specific
  f.push({ id: id("opening"), type: "opening", text: "El baluarte escupía humo. Las escalas aguardaban en la línea de partida.", tags: ["siege", "flandes"] });
  f.push({ id: id("attack"), type: "attack", text: "Las escalas subieron bajo la andanada. La línea de picas esperaba abajo.", tags: ["siege", "attack"] });
  f.push({ id: id("victory"), type: "victory", text: "La bandera del tercio ondeó en el baluarte. La compañía descansó entre muertos.", tags: ["victory", "siege"] });
  f.push({ id: id("defeat"), type: "defeat", text: "Las escalas se rompieron. La compañía se retiró a la zanja.", tags: ["defeat", "siege"] });
  f.push({ id: id("loot"), type: "loot", text: "En el baluarte había un cofre con monedas y un cofre con pólvora seca.", tags: ["loot", "siege"] });

  // Tavern/duel-specific
  f.push({ id: id("opening"), type: "opening", text: "La taberna olía a vino agrio y a rencor.", tags: ["tavern", "duel"] });
  f.push({ id: id("attack"), type: "attack", text: "El veterano soltó la daga antes de terminar la frase.", tags: ["tavern", "duel"] });
  f.push({ id: id("hit"), type: "hit", text: "La daga del rival te alcanzó la mano. Sostuviste la tuya.", tags: ["tavern", "duel", "hit"] });
  f.push({ id: id("victory"), type: "victory", text: "El rival se levantó del suelo. Pagó la ronda y el silencio.", tags: ["victory", "tavern"] });

  // Convoy/escort
  f.push({ id: id("opening"), type: "opening", text: "El convoy arrancó con un chasquido de ejes y una maldición.", tags: ["convoy", "escort"] });
  f.push({ id: id("hit"), type: "hit", text: "El salteador cayó del carro. La mula siguió tirando.", tags: ["hit", "convoy"] });
  f.push({ id: id("victory"), type: "victory", text: "El convoy llegó al almacén. El sargento contó los barriles.", tags: ["victory", "convoy"] });
  f.push({ id: id("loot"), type: "loot", text: "El carretero muerto llevaba una bota de vino y tres doblones.", tags: ["loot", "convoy"] });

  // Mutiny/camp
  f.push({ id: id("opening"), type: "opening", text: "Los veteranos cerraron el cofre con un gesto que no admitía réplica.", tags: ["mutiny", "camp"] });
  f.push({ id: id("defeat"), type: "defeat", text: "Los amotinados se llevaron la mitad de la paga antes del alba.", tags: ["defeat", "mutiny", "pay"] });
  f.push({ id: id("victory"), type: "victory", text: "El cabo convenció a la tropa. La paga se repartió en orden.", tags: ["victory", "mutiny", "pay"] });
  f.push({ id: id("wound"), type: "wound", text: "El motín dejó tres hombres con cortes en la cara. La línea, una nota triste.", tags: ["wound", "mutiny"] });

  // Firearm-heavy
  f.push({ id: id("hit"), type: "hit", text: "La andanada pasó por encima del seto. Cuatro hombres no se levantaron.", tags: ["hit", "volley", "flandes"] });
  f.push({ id: id("miss"), type: "miss", text: "El arcabuz del enemigo hizo un chasquido seco. La mecha estaba apagada.", tags: ["miss", "firearm"] });
  f.push({ id: id("attack"), type: "attack", text: "Los arcabuceros cargaron las mechas. El sargento contó tres.", tags: ["firearm", "attack"] });
  f.push({ id: id("loot"), type: "loot", text: "El arcabucero enemigo dejó saquito de pólvora y un pedernal bueno.", tags: ["loot", "firearm"] });

  // Misc flavor
  f.push({ id: id("opening"), type: "opening", text: "La línea se cerró. El sargento miró al cielo y rezó en voz baja.", tags: ["camp", "religion"] });
  f.push({ id: id("wound"), type: "wound", text: "El frío le mordió los dedos. La mecha ya no prendía.", tags: ["wound", "weather", "flandes"] });
  f.push({ id: id("wound"), type: "wound", text: "La diarrea tumbó a tres antes del alba. La marcha se retrasó.", tags: ["wound", "camp", "mature"] });
  f.push({ id: id("loot"), type: "loot", text: "La tienda del oficial guardaba comida seca y un odre de vino bueno.", tags: ["loot", "officer"] });
  f.push({ id: id("hit"), type: "hit", text: "El oficial enemigo cayó sobre su propia bandera. La línea siguió.", tags: ["hit", "officer", "boss"] });
  f.push({ id: id("victory"), type: "victory", text: "La bandera del tercio ondeó en la colina. El enemigo se rindió.", tags: ["victory", "italy"] });
  f.push({ id: id("defeat"), type: "defeat", text: "La andanada enemiga deshizo la primera fila. La segunda aguantó a duras penas.", tags: ["defeat", "volley"] });

  return f;
}
