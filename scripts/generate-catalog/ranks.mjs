#!/usr/bin/env node
// ranks.mjs — 12 ranks from bisoño to coronel.

export function buildRanks() {
  return [
    { id: "bisono", name: "Bisoño", order: 1, requiredXp: 0, requiredHonor: 0, pay: 2, description: "Recién llegado, sin oficio de guerra.", unlocks: ["training_drill_pike", "training_drill_sword", "training_drill_arquebus", "mission_camino_barroso_001"] },
    { id: "soldado", name: "Soldado", order: 2, requiredXp: 20, requiredHonor: 2, pay: 3, description: "Ya conoce la línea. Aún se le nota el barro.", unlocks: ["training_drill_cunning", "mission_patrulla_bosque_001"] },
    { id: "soldado_viejo", name: "Soldado viejo", order: 3, requiredXp: 60, requiredHonor: 8, pay: 4, description: "Ha visto dos campañas. Sabe obedecer y callar.", unlocks: ["mission_convoy_001"] },
    { id: "cabo", name: "Cabo", order: 4, requiredXp: 110, requiredHonor: 18, pay: 5, description: "Manda una partida. Le obedecen a disgusto.", unlocks: ["mission_patrulla_bosque_002"] },
    { id: "cabo_de_escuadra", name: "Cabo de escuadra", order: 5, requiredXp: 180, requiredHonor: 28, pay: 6, description: "Lidera una escuadra en la línea.", unlocks: ["mission_trinchera_001"] },
    { id: "sargento", name: "Sargento", order: 6, requiredXp: 280, requiredHonor: 45, pay: 8, description: "Sargento de compañía. Voz que se oye en la línea.", unlocks: ["mission_asedio_001"] },
    { id: "sargento_primero", name: "Sargento primero", order: 7, requiredXp: 400, requiredHonor: 65, pay: 10, description: "El brazo derecho del capitán.", unlocks: ["mission_escaramuza_flandes_001"] },
    { id: "alferez", name: "Alférez", order: 8, requiredXp: 560, requiredHonor: 90, pay: 12, description: "Porta la bandera. No debe caer.", unlocks: ["mission_escaramuza_italia_001"] },
    { id: "capitan", name: "Capitán", order: 9, requiredXp: 760, requiredHonor: 120, pay: 16, description: "Manda la compañía. Pesa más que su espada.", unlocks: ["mission_comandante_001"] },
    { id: "maestre_de_campo", name: "Maestre de campo", order: 10, requiredXp: 1000, requiredHonor: 160, pay: 22, description: "Manda el tercio. Decide quién vive y quién paga.", unlocks: ["mission_asedio_baluarte_001"] },
    { id: "teniente_coronel", name: "Teniente coronel", order: 11, requiredXp: 1300, requiredHonor: 220, pay: 30, description: "Mano derecha del maestre. Pone orden en la línea.", unlocks: ["mission_reconocimiento_001"] },
    { id: "coronel", name: "Coronel", order: 12, requiredXp: 1700, requiredHonor: 300, pay: 40, description: "Jefe del tercio. Su firma vale una vida.", unlocks: [] },
  ];
}
