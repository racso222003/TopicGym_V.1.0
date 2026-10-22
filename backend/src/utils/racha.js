'use strict';

function toISODate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10);
}

/** Racha de días consecutivos de actividad (permite empezar ayer si hoy no hay actividad). */
function calcularRacha(dias) {
  if (!dias.length) return 0;
  const set = new Set(dias.map(toISODate));
  const cursor = new Date();
  if (!set.has(toISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(toISODate(cursor))) return 0;
  }
  let racha = 0;
  while (set.has(toISODate(cursor))) {
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

/** Racha más larga registrada. */
function calcularRachaMaxima(dias) {
  const orden = [...new Set(dias.map(toISODate))].sort();
  let max = 0;
  let actual = 0;
  let anterior = null;
  for (const dia of orden) {
    if (anterior) {
      const prev = new Date(anterior);
      prev.setDate(prev.getDate() + 1);
      actual = toISODate(prev) === dia ? actual + 1 : 1;
    } else {
      actual = 1;
    }
    max = Math.max(max, actual);
    anterior = dia;
  }
  return max;
}

module.exports = { toISODate, calcularRacha, calcularRachaMaxima };
