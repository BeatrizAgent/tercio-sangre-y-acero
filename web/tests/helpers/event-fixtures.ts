// Event fixtures: builds a GameEvent with a known shape so domain/store tests
// can drive the resolveActiveEventChoice path without depending on the catalog.

import type { GameEvent } from "../../src/lib/types";

export function makeGameEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: "evt_test_001",
    title: "Encuentro en el camino",
    text: "Un viajero herido pide agua y pan.",
    choices: [
      {
        id: "choice_help",
        label: "Ayudar al viajero",
        requirements: {},
        effects: { honor: 1, coins: -5 },
        result_text: "El viajero te bendice y se aleja.",
      },
      {
        id: "choice_ignore",
        label: "Pasar de largo",
        requirements: {},
        effects: { reputation: -1 },
        result_text: "Te alejas sin mirar atras.",
      },
    ],
    ...overrides,
  };
}
