import type { StoryArc } from "../types";

export const PROLOGUE_STORY_ARC_ID = "prologue_castilla";

export const prologueStoryArc: StoryArc = {
  id: PROLOGUE_STORY_ARC_ID,
  title: "Capitulo 1: La leva de Castilla",
  subtitle: "Temporero, hermano, barro y promesas dulces.",
  chapters: [
    {
      id: "cap1_choza_castellana",
      title: "Casa de tierra y humo",
      text: "Diego despierta antes del alba. La choza huele a humo viejo, pan duro y miedo callado. Su hermanito busca una voz que ya no esta: la madre murio al parirlo.",
      sceneAssetId: "story_castilla_choza_hermanos",
      characters: [
        { id: "diego", name: "Diego de Arce", role: "Temporero" },
        { id: "martin", name: "Martin", role: "Hermanito", portraitAssetId: "story_martin_paje_portrait" },
      ],
      dialogue: [
        { speakerId: "martin", text: "Diego, padre vuelve tarde?" },
        { speakerId: "diego", text: "Duerme pegado a mi. Si la puerta cruje, mirame a mi." },
      ],
      choices: [
        {
          id: "shield_brother",
          label: "Cubrir al nino con la manta",
          effects: { xp: 5, honor: 1, fatigue: 1, stats: { vigor: 1, discipline: 1 } },
          resultText: "No arreglas la casa. Pero Martin deja de temblar un rato.",
        },
        {
          id: "swallow_rage",
          label: "Tragar rabia y preparar el tajo",
          effects: { xp: 4, fatigue: 2, corruption: 1, stats: { cunning: 1, discipline: 1 } },
          resultText: "La rabia baja al estomago. Alli se queda, como piedra.",
        },
      ],
    },
    {
      id: "cap1_recuerdo_madre",
      title: "El pan de la madre",
      text: "En una caja pobre quedan tres cosas de la madre: una mantilla gastada, un rosario de madera y una tonada que Diego apenas recuerda. Martin llora sin ruido.",
      sceneAssetId: "story_castilla_choza_hermanos",
      characters: [
        { id: "diego", name: "Diego de Arce", role: "Hijo mayor" },
        { id: "mother", name: "Madre de Diego", role: "Recuerdo", portraitAssetId: "story_madre_recuerdo_portrait" },
        { id: "martin", name: "Martin", role: "Hermanito", portraitAssetId: "story_martin_paje_portrait" },
      ],
      puzzle: {
        id: "mother_memory_order",
        kind: "sequence",
        title: "Orden de los recuerdos",
        prompt: "Ordena los recuerdos como Diego se los muestra a Martin: primero lo que puede tocar, luego lo que puede besar, al final lo que puede oir.",
        options: [
          { id: "mantilla", label: "Mantilla", description: "Tela gastada con olor a humo limpio." },
          { id: "rosary", label: "Rosario", description: "Cuentas de madera pulida." },
          { id: "lullaby", label: "Tonada", description: "Una nana rota, casi olvidada." },
        ],
        answer: ["mantilla", "rosary", "lullaby"],
        successText: "El orden calma al nino",
        failureText: "Resuelve el puzle: Martin necesita un recuerdo claro antes de seguir.",
      },
      choices: [
        {
          id: "sing_low",
          label: "Canturrear bajo",
          effects: { xp: 6, honor: 1, stats: { discipline: 1, command: 1 } },
          resultText: "La voz sale pobre, pero sale. Martin aprieta el rosario and respira.",
        },
        {
          id: "promise_to_carry",
          label: "Prometer llevar su recuerdo",
          effects: { xp: 6, fatigue: 1, items: [{ itemId: "consumable_pan_duro_001", quantity: 1 }], stats: { vigor: 1, cunning: 1 } },
          resultText: "Guardas pan y memoria en la misma talega. Ninguna de las dos pesa poco.",
        },
      ],
    },
    {
      id: "cap1_padre_sombra",
      title: "La sombra del padre",
      text: "El padre vuelve con vino agrio en la boca. No hace falta ver el golpe para saber que viene. La mesa calla, la pared calla, Diego no.",
      sceneAssetId: "story_castilla_choza_hermanos",
      mature: true,
      presentation: "blurred",
      characters: [
        { id: "diego", name: "Diego de Arce", role: "Hijo mayor" },
        { id: "father", name: "Padre de Diego", role: "Viudo roto", portraitAssetId: "story_padre_viudo_portrait" },
        { id: "martin", name: "Martin", role: "Hermanito", portraitAssetId: "story_martin_paje_portrait" },
      ],
      dialogue: [
        { speakerId: "father", text: "Otra boca. Otra culpa." },
        { speakerId: "diego", text: "La culpa no duerme en la cuna." },
      ],
      choices: [
        {
          id: "endure_silence",
          label: "Aguantar y sacar a Martin fuera",
          effects: { xp: 7, fatigue: 3, honor: 1, stats: { discipline: 1, cunning: 1 } },
          resultText: "La puerta se cierra detras de vosotros. El aire frio parece misericordia.",
        },
        {
          id: "step_between",
          label: "Ponerte entre padre y nino",
          effects: { xp: 9, fatigue: 5, honor: 2, wound: "wound_corte_mano_001", stats: { vigor: 2 } },
          resultText: "La mano duele. Martin no recibe el golpe. Hay cuentas que se pagan asi.",
        },
      ],
    },
    {
      id: "cap1_talega_temporero",
      title: "La talega del temporero",
      text: "El campo no espera tristezas. Diego ata sarmientos, carga sacos y mira la talega: si va a marchar, debe caber una vida pobre y un nino pequeno.",
      sceneAssetId: "story_castilla_despedida_camino",
      characters: [
        { id: "diego", name: "Diego de Arce", role: "Temporero" },
        { id: "martin", name: "Martin", role: "Hermanito", portraitAssetId: "story_martin_paje_portrait" },
      ],
      dialogue: [
        { speakerId: "martin", text: "Cabe mi manta?" },
        { speakerId: "diego", text: "Cabe lo que nos mantenga andando. Lo demas se queda con la tierra." },
      ],
      choices: [
        {
          id: "pack_for_two",
          label: "Cerrar la talega para dos",
          effects: { xp: 8, fatigue: 2, items: [{ itemId: "consumable_pan_duro_001", quantity: 1 }], stats: { vigor: 1, cunning: 1 } },
          resultText: "La talega queda flaca. Pero Martin podra caminar un poco mas.",
        },
        {
          id: "hide_coin",
          label: "Coser dos monedas en la faja",
          effects: { xp: 7, coins: -2, fatigue: 1, honor: 1, stats: { cunning: 2 } },
          resultText: "Pierdes doblones de hoy para comprar hambre manana.",
        },
      ],
    },
    {
      id: "cap1_abuelo_hogar",
      title: "El consejo del abuelo",
      text: "El abuelo habla junto al hogar bajo. Sirvio poco, sufrio mucho y aprendio bastante. Dice que el tercio no salva a nadie, pero saca a algunos del pozo.",
      sceneAssetId: "story_castilla_abuelo_hogar",
      characters: [
        { id: "diego", name: "Diego de Arce", role: "Nieto" },
        { id: "grandfather", name: "Abuelo Hernan", role: "Viejo soldado", portraitAssetId: "story_abuelo_hernan_portrait" },
      ],
      dialogue: [
        { speakerId: "grandfather", text: "La aldea te come despacio. La guerra, deprisa. Elige que dientes entiendes." },
        { speakerId: "diego", text: "Y Martin?" },
        { speakerId: "grandfather", text: "Si lo dejas aqui, tambien lo recluta la miseria." },
      ],
      choices: [
        {
          id: "listen_old_war",
          label: "Escuchar al viejo sin interrumpir",
          effects: { xp: 10, honor: 1, fatigue: 1, stats: { discipline: 1, command: 1 } },
          resultText: "No recibes consuelo. Recibes mapa.",
        },
        {
          id: "ask_price",
          label: "Preguntar el precio de marchar",
          effects: { xp: 9, reputation: 1, stats: { cunning: 1, command: 1 } },
          resultText: "El abuelo no sonrie: 'Todo precio que no ves al principio llega con intereses'.",
        },
      ],
    },
    {
      id: "cap1_despedida_romance",
      title: "La ultima era",
      text: "Ines espera en el camino seco. No promete aguardar para siempre. Diego tampoco miente. Entre ambos queda la vida que pudo ser: siega, invierno, hijos, deuda.",
      sceneAssetId: "story_castilla_despedida_camino",
      characters: [
        { id: "diego", name: "Diego de Arce", role: "Temporero" },
        { id: "ines", name: "Ines", role: "Interes romantico", portraitAssetId: "story_ines_castilla_portrait" },
      ],
      dialogue: [
        { speakerId: "ines", text: "No me hables como soldado si aun llevas tierra en las manos." },
        { speakerId: "diego", text: "Por eso marcho. Para que la tierra no sea lo unico que herede Martin." },
      ],
      choices: [
        {
          id: "leave_token",
          label: "Dejarle la cinta de la talega",
          effects: { xp: 9, honor: 1, fatigue: 1, stats: { vigor: 1, command: 1 } },
          resultText: "Ines guarda la cinta sin prometer nada. Eso la hace mas verdadera.",
        },
        {
          id: "speak_truth",
          label: "Decir la verdad sin adorno",
          effects: { xp: 11, honor: 2, reputation: -1, stats: { discipline: 1, cunning: 1 } },
          resultText: "Las palabras duelen porque no van vestidas. Ines asiente y mira el camino.",
        },
      ],
    },
    {
      id: "cap1_leva_veteranos",
      title: "Dulces palabras de leva",
      text: "Los veteranos llegan con morriones brillados a mano, cicatrices discretas y sonrisas de taberna. Prometen paga, pan, capa y honra. El escribano moja la pluma.",
      sceneAssetId: "story_castilla_leva_veteranos",
      characters: [
        { id: "diego", name: "Diego de Arce", role: "Mozo de leva" },
        { id: "recruiter", name: "Sargento Valcarcel", role: "Veterano reclutador", portraitAssetId: "story_sargento_valcarcel_portrait" },
        { id: "martin", name: "Martin", role: "Hermanito", portraitAssetId: "story_martin_paje_portrait" },
      ],
      dialogue: [
        { speakerId: "recruiter", text: "Paga, pan, capa y honra. Cuatro palabras bastan para sacar a un hombre del barro." },
        { speakerId: "diego", text: "Y para meterlo en deuda, si la pluma escribe torcido." },
      ],
      choices: [
        {
          id: "sign_aware",
          label: "Firmar sabiendo que hay deuda",
          effects: {
            xp: 12,
            coins: 6,
            honor: 1,
            fatigue: 2,
            items: [{ itemId: "weapon_pica_gastada_001", quantity: 1 }],
            stats: { pike: 2, vigor: 1 },
            equipment: { mainHand: "weapon_pica_gastada_001" },
          },
          resultText: "La pluma raspa. Ya no eres temporero. Aun no eres soldado. Eso tambien es un peligro.",
        },
        {
          id: "challenge_smile",
          label: "Preguntar por botas y atrasos",
          effects: {
            xp: 13,
            reputation: 2,
            fatigue: 2,
            items: [{ itemId: "weapon_ropera_ronosa_001", quantity: 1 }],
            stats: { sword: 2, cunning: 1 },
            equipment: { mainHand: "weapon_ropera_ronosa_001" },
          },
          resultText: "El sargento rie con dientes buenos. El escribano te mira como quien subraya un nombre.",
        },
      ],
    },
    {
      id: "cap1_hermano_paje",
      title: "Un paje en la columna",
      text: "Martin no suelta la manga de Diego. Nadie quiere otro nino en la marcha, pero nadie ofrece techo limpio. El tercio abre camino. La aldea cierra la boca.",
      sceneAssetId: "story_castilla_leva_veteranos",
      characters: [
        { id: "diego", name: "Diego de Arce", role: "Recluta" },
        { id: "martin", name: "Martin", role: "Paje", portraitAssetId: "story_martin_paje_portrait" },
        { id: "recruiter", name: "Sargento Valcarcel", role: "Veterano reclutador", portraitAssetId: "story_sargento_valcarcel_portrait" },
      ],
      dialogue: [
        { speakerId: "recruiter", text: "Un paje come poco y aprende rapido. Si no estorba, marcha." },
        { speakerId: "diego", text: "Marcha conmigo." },
      ],
      choices: [
        {
          id: "take_brother_page",
          label: "Llevar a Martin como paje",
          effects: {
            xp: 16,
            honor: 2,
            fatigue: 3,
            items: [
              { itemId: "consumable_vendas_001", quantity: 1 },
              { itemId: "chest_cuirass_001", quantity: 1 },
            ],
            stats: { command: 1, discipline: 1 },
            equipment: { body: "chest_cuirass_001" },
          },
          resultText: "Martin camina a tu sombra. La columna traga dos vidas de Castilla.",
        },
        {
          id: "leave_with_neighbors",
          label: "Buscarle techo antes de marchar",
          effects: {
            xp: 14,
            honor: 1,
            coins: -4,
            fatigue: 2,
            items: [{ itemId: "weapon_arcabuz_bisono_001", quantity: 1 }],
            stats: { arquebus: 2, discipline: 1 },
            equipment: { firearm: "weapon_arcabuz_bisono_001" },
          },
          resultText: "Pagas pan ajeno con moneda propia. Martin entiende demasiado para su edad.",
        },
      ],
    },
  ],
};

export function getStoryChapter(chapterId: string | undefined) {
  if (!chapterId) return undefined;
  return prologueStoryArc.chapters.find((chapter) => chapter.id === chapterId);
}

export function getNextStoryChapter(chapterId: string) {
  const index = prologueStoryArc.chapters.findIndex((chapter) => chapter.id === chapterId);
  if (index < 0) return undefined;
  return prologueStoryArc.chapters[index + 1];
}
