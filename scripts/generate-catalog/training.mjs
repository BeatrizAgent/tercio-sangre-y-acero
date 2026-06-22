#!/usr/bin/env node
// training.mjs — 7 training entries (pike, sword, arquebus, discipline, vigor, cunning, command).

export function buildTraining() {
  return [
    { id: "training_drill_pike", stat: "pike", name: "Pica", description: "Empuje, formación y aguante. Horas de línea hasta que duelan los hombros.", baseCost: 8, costScale: 1.35, fatigueCost: 3, requiredRankId: "bisono" },
    { id: "training_drill_sword", stat: "sword", name: "Espada", description: "Hoja roma, manos moradas, menos errores.", baseCost: 9, costScale: 1.35, fatigueCost: 3, requiredRankId: "bisono" },
    { id: "training_drill_arquebus", stat: "arquebus", name: "Arcabuz", description: "Recarga lenta con humedad mientras el sargento maldice.", baseCost: 10, costScale: 1.35, fatigueCost: 3, requiredRankId: "bisono" },
    { id: "training_drill_discipline", stat: "discipline", name: "Disciplina de compañía", description: "Estar quieto, moverse junto, temer después.", baseCost: 6, costScale: 1.3, fatigueCost: 2, requiredRankId: "bisono" },
    { id: "training_drill_vigor", stat: "vigor", name: "Marcha con equipo", description: "Camino de barro, mochila llena, ninguna queja que sirva.", baseCost: 5, costScale: 1.3, fatigueCost: 4, requiredRankId: "bisono" },
    { id: "training_drill_cunning", stat: "cunning", name: "Astucia de campaña", description: "Leer el peligro, sobrevivir a la trampa, ver la ocasión.", baseCost: 9, costScale: 1.35, fatigueCost: 2, requiredRankId: "soldado" },
    { id: "training_drill_command", stat: "command", name: "Mando de unidad", description: "Voz que se oye, ejemplo que arrastra, decisión que pesa.", baseCost: 14, costScale: 1.4, fatigueCost: 4, requiredRankId: "cabo" },
  ];
}
