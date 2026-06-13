export const wounds = [
  { id: "shallow_cut", name: "Shallow Cut", severity: 1, effects: { vigor: -1 }, description: "Blood enough to stain the sleeve." },
  { id: "deep_cut", name: "Deep Cut", severity: 3, effects: { vigor: -2, sword: -1 }, description: "A wound that opens when the line moves." },
  { id: "powder_burn", name: "Powder Burn", severity: 2, effects: { arquebus: -1 }, description: "Blackened skin from bad powder and worse timing." },
  { id: "fever", name: "Fever", severity: 3, effects: { vigor: -2, discipline: -1 }, description: "Sweat, prayer, and the smell of wet straw." },
  { id: "sprained_ankle", name: "Sprained Ankle", severity: 2, effects: { vigor: -1 }, description: "Every march becomes longer." },
  { id: "broken_rib", name: "Broken Rib", severity: 3, effects: { vigor: -2, pike: -1 }, description: "Breathing hurts, coughing punishes." },
  { id: "infected_wound", name: "Infected Wound", severity: 4, effects: { vigor: -3, discipline: -2 }, description: "Heat under skin and fear under words." },
  { id: "damaged_hearing", name: "Damaged Hearing", severity: 2, effects: { command: -1 }, description: "Orders arrive through a dull ringing." },
  { id: "bruised_hand", name: "Bruised Hand", severity: 1, effects: { sword: -1, arquebus: -1 }, description: "Purple knuckles, poor grip." },
  { id: "shaken_morale", name: "Shaken Morale", severity: 2, effects: { discipline: -1, command: -1 }, description: "The line held, but only outside." },
] as const;
