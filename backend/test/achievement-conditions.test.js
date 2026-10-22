'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { cumpleCondicion } = require('../src/services/ejercicios.service');

const metricas = {
  puntos_acumulados: 100,
  niveles_completados: ['DIFICIL'],
  temas_perfectos: 1,
  temas_explorados: 5,
  aciertos_primer_intento: 10,
  intentos_totales: 30,
  ejercicios_dificiles: 5,
  racha_dias: 7,
  aciertos_totales: 10,
  ejercicios_distintos_correctos: 15,
};

test('evalúa las ocho condiciones JSONB nuevas', () => {
  const condiciones = [
    { tipo: 'puntos_acumulados', valor: 100 },
    { tipo: 'dificultad_completada', nivel: 'DIFICIL' },
    { tipo: 'tema_perfecto' },
    { tipo: 'temas_explorados', valor: 5 },
    { tipo: 'aciertos_primer_intento', valor: 10 },
    { tipo: 'intentos_totales', valor: 30 },
    { tipo: 'ejercicios_dificiles', valor: 5 },
    { tipo: 'racha_dias', valor: 7 },
  ];

  for (const condicion of condiciones) {
    assert.equal(cumpleCondicion(condicion, metricas), true, condicion.tipo);
  }
});

test('mantiene compatibles las condiciones de los cuatro logros iniciales', () => {
  assert.equal(cumpleCondicion({ tipo: 'aciertos_totales', valor: 1 }, metricas), true);
  assert.equal(cumpleCondicion({ tipo: 'ejercicios_distintos_correctos', valor: 15 }, metricas), true);
  assert.equal(cumpleCondicion({ aciertos_min: 15 }, metricas, 'MAESTRO_LOGICA'), true);
  assert.equal(cumpleCondicion({ racha_dias: 3 }, metricas, 'RACHA_INICIAL'), true);
});

test('no desbloquea cuando una métrica no alcanza el umbral o la condición es desconocida', () => {
  const metricasBajas = { ...metricas, puntos_acumulados: 99, temas_perfectos: 0 };

  assert.equal(cumpleCondicion({ tipo: 'puntos_acumulados', valor: 100 }, metricasBajas), false);
  assert.equal(cumpleCondicion({ tipo: 'tema_perfecto' }, metricasBajas), false);
  assert.equal(cumpleCondicion({ tipo: 'condicion_inexistente' }, metricas), false);
  assert.equal(cumpleCondicion(null, metricas), false);
});
