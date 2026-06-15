import eventsJson from "./json/events.json";
import type { GameEvent } from "../src/lib/types";

export const events: GameEvent[] = (eventsJson as any).map((evt: any) => ({
  id: evt.id,
  title: evt.title,
  text: evt.text,
  assetId: evt.assetId,
  mature: evt.mature,
  presentation: evt.presentation,
  choices: evt.choices.map((c: any) => ({
    id: c.id,
    label: c.label,
    requirements: {
      coins: c.requirements?.coins,
      items: c.requirements?.items
        ? c.requirements.items.map((it: any) => ({ itemId: it.itemId, quantity: it.quantity }))
        : undefined,
    },
    effects: {
      coins: c.effects?.coins,
      honor: c.effects?.honor,
      fatigue: c.effects?.fatigue,
      reputation: c.effects?.reputation,
      corruption: c.effects?.corruption,
      wound: c.effects?.wound,
      breakEquipment: c.effects?.breakEquipment,
      items: c.effects?.items
        ? c.effects.items.map((it: any) => ({ itemId: it.itemId, quantity: it.quantity }))
        : undefined,
    },
    result_text: c.result_text,
  })),
}));
