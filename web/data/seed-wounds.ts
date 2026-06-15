import woundsJson from "./json/wounds.json";

export const wounds = woundsJson.map((wound) => ({
  id: wound.id,
  name: wound.name,
  severity: wound.severity,
  effects: { ...wound.effects },
  description: wound.description,
  treatmentItems: [...(wound.treatment_items || [])],
}));
