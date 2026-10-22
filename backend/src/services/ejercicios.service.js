'use strict';

const repo = require('../repositories/ejercicios.repo');
const { withTransaction } = require('../config/db');
const { calcularRacha, calcularRachaMaxima } = require('../utils/racha');

const NIVELES = ['FACIL', 'MEDIO', 'DIFICIL'];

function normalizarNivel(nivel) {
  if (!nivel) return null;
  const v = String(nivel).toUpperCase();
  return NIVELES.includes(v) ? v : null;
}

/** Lista el banco de ejercicios del piloto (sin revelar respuestas). */
async function listar(temaId, nivel) {
  return repo.listByTopic(temaId, normalizarNivel(nivel));
}

/**
 * Valida la respuesta de un ejercicio.
 * Regla de negocio (Acta/Arquitectura): puntos solo en el primer intento correcto.
 */
async function validar({ usuarioId, ejercicioId, opcionId, textoRespuesta }) {
  const ejercicio = await repo.findWithOpciones(ejercicioId);
  if (!ejercicio) {
    const err = new Error(`Ejercicio ${ejercicioId} no encontrado.`);
    err.status = 404;
    throw err;
  }

  const esOpcionMultiple = ejercicio.tipo === 'OPCION_MULTIPLE';
  let correcta = false;
  let opcionCorrecta = null;

  if (esOpcionMultiple) {
    if (!opcionId) {
      const err = new Error('Debes seleccionar una opción de respuesta.');
      err.status = 400;
      throw err;
    }
    opcionCorrecta = ejercicio.opciones.find((o) => o.es_correcta) || null;
    correcta = Boolean(opcionCorrecta) && opcionCorrecta.id === Number(opcionId);
  }
  // tipo PSEUDOCODIGO: se almacena para revisión manual; no se autocalifica en el piloto.

  const resultado = await withTransaction(async (client) => {
    const intentosPrevios = await repo.contarIntentos(client, usuarioId, ejercicioId);
    const intento = intentosPrevios + 1;
    const esPrimerIntento = intento === 1;
    const puntos = correcta && esPrimerIntento ? ejercicio.puntos_ponderados : 0;

    await repo.registrarRespuesta(client, {
      usuarioId,
      ejercicioId,
      opcionId: opcionId || null,
      textoRespuesta: textoRespuesta || null,
      correcta,
      intento,
    });

    if (puntos > 0) {
      await repo.sumarProgreso(client, {
        usuarioId,
        temaId: ejercicio.tema_id,
        resuelto: true,
        puntos,
      });
    }

    return { intento, esPrimerIntento, puntos };
  });

  const logrosOtorgados = await evaluarLogros(usuarioId);

  return {
    correcta,
    puntos: resultado.puntos,
    intento: resultado.intento,
    primerIntento: resultado.esPrimerIntento,
    explicacion: ejercicio.explicacion,
    opcionCorrectaId: opcionCorrecta ? opcionCorrecta.id : null,
    logros: logrosOtorgados,
  };
}

/** Interpreta las condiciones JSONB de logros sin acoplar el motor a sus códigos. */
function cumpleCondicion(condicion, metricas, codigo = '') {
  if (!condicion || typeof condicion !== 'object') return false;

  // Compatibilidad temporal con filas antiguas que aún no hayan pasado por la migración.
  let tipo = condicion.tipo;
  if (!tipo && Object.hasOwn(condicion, 'aciertos_min')) {
    tipo = codigo === 'MAESTRO_LOGICA' ? 'ejercicios_distintos_correctos' : 'aciertos_totales';
  } else if (!tipo && Object.hasOwn(condicion, 'racha_dias')) {
    tipo = 'racha_dias';
  }
  const valor = Number(condicion.valor ?? condicion.aciertos_min ?? condicion.racha_dias ?? 1);

  switch (tipo) {
    case 'puntos_acumulados':
      return metricas.puntos_acumulados >= valor;
    case 'dificultad_completada':
      return Array.isArray(metricas.niveles_completados) &&
        metricas.niveles_completados.includes(String(condicion.nivel || '').toUpperCase());
    case 'tema_perfecto':
      return metricas.temas_perfectos > 0;
    case 'temas_explorados':
      return metricas.temas_explorados >= valor;
    case 'aciertos_primer_intento':
      return metricas.aciertos_primer_intento >= valor;
    case 'intentos_totales':
      return metricas.intentos_totales >= valor;
    case 'ejercicios_dificiles':
      return metricas.ejercicios_dificiles >= valor;
    case 'racha_dias':
      return metricas.racha_dias >= valor;
    case 'aciertos_totales':
      return metricas.aciertos_totales >= valor;
    case 'ejercicios_distintos_correctos':
      return metricas.ejercicios_distintos_correctos >= valor;
    default:
      return false;
  }
}

/** Evalúa y otorga logros después de confirmar la transacción de la respuesta. */
async function evaluarLogros(usuarioId) {
  const [metricas, dias, logros] = await Promise.all([
    repo.getMetricasLogros(usuarioId),
    repo.listDiasActivos(usuarioId),
    repo.listLogrosEvaluables(),
  ]);
  metricas.racha_dias = calcularRacha(dias);

  const candidatos = logros.filter((logro) => cumpleCondicion(logro.condicion, metricas, logro.codigo));
  if (candidatos.length === 0) return [];

  // Una única transacción pequeña tras la transacción principal; el índice único
  // de logros_obtenidos resuelve de forma segura respuestas concurrentes.
  const nuevosIds = new Set(
    await withTransaction((client) =>
      repo.otorgarLogros(client, usuarioId, candidatos.map((logro) => logro.id)),
    ),
  );
  return candidatos
    .filter((logro) => nuevosIds.has(logro.id))
    .map(({ codigo, nombre, puntos }) => ({ codigo, nombre, puntos }));
}

async function progreso(usuarioId) {
  return repo.getProgreso(usuarioId);
}

async function logros(usuarioId) {
  return repo.listLogros(usuarioId);
}

async function stats(usuarioId) {
  const resumen = await repo.getResumen(usuarioId);
  const dias = await repo.listDiasActivos(usuarioId);
  return {
    puntos_totales: resumen.puntos_totales,
    aciertos: resumen.aciertos,
    intentos: resumen.intentos,
    racha_actual: calcularRacha(dias),
    racha_maxima: calcularRachaMaxima(dias),
    dias_activos: dias.length,
  };
}

module.exports = { listar, validar, progreso, logros, stats, cumpleCondicion };
