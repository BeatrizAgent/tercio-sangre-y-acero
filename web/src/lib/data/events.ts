// Mission event definitions (the random mid-mission choices). Backed by the
// unified catalog.

import {
  eventDefinitions as catalogEvents,
  getEvent as catalogGetEvent,
} from "./catalog";
import type { GameEvent } from "../types";

export const eventDefinitions: readonly GameEvent[] = catalogEvents.map((e) => {
  const presentation: GameEvent["presentation"] =
    e.presentation === "silhouette"
      ? "obscured"
      : (e.presentation as GameEvent["presentation"]);
  return {
    id: e.id,
    title: e.name,
    text: e.description,
    assetId: undefined,
    mature: e.mature,
    presentation,
    choices: e.choices.map((c) => ({
      id: c.id,
      label: c.label,
      requirements: {},
      effects: c.effects as GameEvent["choices"][number]["effects"],
      result_text: c.result_text ?? "",
    })),
  };
});

export function getEvent(eventId: string | undefined) {
  return catalogGetEvent(eventId);
}
