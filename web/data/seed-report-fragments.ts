import reportFragmentsJson from "./json/report_fragments.json";

export const reportFragments = reportFragmentsJson.map((fragment) => ({
  id: fragment.id,
  type: fragment.type,
  tags: [...fragment.tags],
  text: fragment.text,
}));
