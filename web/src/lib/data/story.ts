import type { StoryArc } from "../types";

export const PROLOGUE_STORY_ARC_ID = "prologue_castilla";

export const prologueStoryArc: StoryArc = {
  id: PROLOGUE_STORY_ARC_ID,
  title: "Prologo de Castilla",
  subtitle: "De la aldea al barro del Tercio.",
  chapters: [
    {
      id: "prologue_village",
      title: "Salida de la aldea",
      text: "Diego deja una casa pobre de tierra seca y humo bajo. Cree que el Tercio es paga, pan y honra. Su madre ata un pan duro en la talega; su padre mira al suelo.",
      sceneAssetId: "asset_scene_camino_barroso_001",
      choices: [
        {
          id: "take_bread",
          label: "Aceptar el pan y prometer volver",
          effects: { xp: 6, coins: 2, honor: 1, items: [{ itemId: "consumable_pan_duro_001", quantity: 1 }] },
          resultText: "Sales ligero de bolsa, pero no del todo solo.",
        },
        {
          id: "sell_keepsake",
          label: "Vender un recuerdo familiar",
          effects: { xp: 4, coins: 8, honor: -1 },
          resultText: "La bolsa pesa mas. El pecho, menos.",
        },
      ],
    },
    {
      id: "prologue_recruiter",
      title: "El reclutador y la promesa",
      text: "El reclutador habla de ducados, jubones limpios y ciudades rendidas. Los mozos escuchan como si oyen misa. Un veterano no rie.",
      sceneAssetId: "mission_select_bg",
      choices: [
        {
          id: "ask_terms",
          label: "Preguntar por paga y deuda",
          effects: { xp: 8, honor: 1, fatigue: 1 },
          resultText: "Te llaman desconfiado. Aprendes primera regla: toda promesa lleva letra pequena.",
        },
        {
          id: "boast",
          label: "Alardear ante los demas mozos",
          effects: { xp: 5, reputation: 2, fatigue: 2 },
          resultText: "Ganas miradas. Tambien ganas enemigos chicos.",
        },
      ],
    },
    {
      id: "prologue_debt",
      title: "Primeras botas, primera deuda",
      text: "Las botas reglamentarias no son regalo. El escribano apunta tu nombre junto a una cifra. La guerra empieza antes de ver enemigo.",
      sceneAssetId: "barracks_bg",
      choices: [
        {
          id: "pay_recruiter",
          label: "Pagar al reclutador",
          requirements: { coins: 8 },
          effects: { coins: -8, xp: 10, honor: 1, items: [{ itemId: "consumable_vendas_001", quantity: 1 }] },
          resultText: "Pagas temprano. La deuda baja, no desaparece.",
        },
        {
          id: "accept_debt",
          label: "Firmar deuda sin leer",
          effects: { xp: 8, coins: 4, corruption: 2 },
          resultText: "El papel queda limpio. Tu futuro, menos.",
        },
      ],
    },
    {
      id: "prologue_muddy_road",
      title: "Camino embarrado",
      text: "La columna avanza con lluvia. La pica se pega al hombro y el barro muerde las botas nuevas.",
      sceneAssetId: "asset_scene_camino_barroso_001",
      choices: [
        {
          id: "carry_powder",
          label: "Cargar barril de polvora",
          effects: { xp: 12, coins: 3, honor: 1, fatigue: 5 },
          resultText: "Llegas con espalda rota y el cabo recuerda tu nombre.",
        },
        {
          id: "trade_bread",
          label: "Cambiar pan por ayuda",
          requirements: { items: [{ itemId: "consumable_pan_duro_001", quantity: 1 }] },
          effects: { xp: 9, fatigue: -2, items: [{ itemId: "consumable_vendas_001", quantity: 1 }] },
          resultText: "Pierdes pan, ganas manos y una venda seca.",
        },
      ],
    },
    {
      id: "prologue_hunger",
      title: "Hambre en marcha",
      text: "Los carros no llegan. En una granja cerrada hay grano. Dentro tambien hay gente que no quiere ver soldados.",
      sceneAssetId: "hunger_path_blurred",
      mature: true,
      presentation: "blurred",
      choices: [
        {
          id: "protect_farm",
          label: "Proteger la casa del saqueo",
          effects: { xp: 14, honor: 3, fatigue: 7 },
          resultText: "Tus hombres gruñen. La puerta queda cerrada y entera.",
        },
        {
          id: "take_grain",
          label: "Tomar grano y marchar",
          effects: { xp: 10, coins: 6, honor: -2, corruption: 6, items: [{ itemId: "consumable_pan_duro_001", quantity: 2 }] },
          resultText: "Comen todos. Nadie canta por la noche.",
        },
      ],
    },
    {
      id: "prologue_wet_powder",
      title: "Polvora humeda",
      text: "La lluvia entra en los barriles. Un arcabucero joven jura que aun prendera. El veterano aparta la cara.",
      sceneAssetId: "asset_scene_convoy_001",
      choices: [
        {
          id: "dry_slow",
          label: "Secar lento junto al fuego bajo",
          effects: { xp: 16, honor: 1, fatigue: 3, items: [{ itemId: "consumable_piedra_001", quantity: 1 }] },
          resultText: "Salvas parte. Nadie explota. Eso ya es victoria.",
        },
        {
          id: "rush_test",
          label: "Probar chispa rapido",
          effects: { xp: 18, coins: 4, fatigue: 6, wound: "wound_corte_mano_001" },
          resultText: "La chispa responde mal. Tu mano tiembla hasta el alba.",
        },
      ],
    },
    {
      id: "prologue_veiled_siege",
      title: "Asedio velado",
      text: "Tras el humo, la brecha no parece heroica. Hay gritos, madera rota y hombres buscando agua donde solo hay barro.",
      sceneAssetId: "dead_horse_road_blurred",
      mature: true,
      presentation: "blurred",
      choices: [
        {
          id: "hold_line",
          label: "Mantener linea con la pica",
          effects: { xp: 24, honor: 3, fatigue: 9 },
          resultText: "La linea no cae. Tu idea de gloria si.",
        },
        {
          id: "pull_wounded",
          label: "Sacar heridos de la brecha",
          effects: { xp: 20, honor: 2, fatigue: 6, items: [{ itemId: "consumable_vendas_001", quantity: 1 }] },
          resultText: "Arrastras cuerpos vivos. No preguntas por los otros.",
        },
      ],
    },
    {
      id: "prologue_unpaid",
      title: "La paga que no llega",
      text: "El pagador trae sello, no bolsa. Diego ya sabe mirar el papel sin creerlo entero.",
      sceneAssetId: "camp_disease_bg",
      choices: [
        {
          id: "stay_silent",
          label: "Guardar silencio y seguir",
          effects: { xp: 30, honor: 2, fatigue: 4 },
          resultText: "No eres el mismo mozo que salio de Castilla.",
        },
        {
          id: "demand_pay",
          label: "Exigir paga ante el cabo",
          effects: { xp: 28, coins: 10, honor: -1, reputation: 2 },
          resultText: "Te dan algo para callarte. Tambien te apuntan.",
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
