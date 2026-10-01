'use strict';

const repo = require('../repositories/ejercicios.repo');
const { withTransaction } = require('../config/db');

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

  const logrosOtorgados = await evaluarLogros(usuarioId, ejercicio.tema_id);

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

/** Evalúa y otorga los logros que correspondan tras responder. */
async function evaluarLogros(usuarioId, temaId) {
  const resumen = await repo.getResumen(usuarioId);
  const dias = await repo.listDiasActivos(usuarioId);

  const candidatos = [];
  if (resumen.aciertos >= 1) candidatos.push('PRIMER_ACIERTO');
  if (resumen.aciertos >= 10) candidatos.push('PRIMERA_SERIE');
  if (calcularRacha(dias) >= 3) candidatos.push('RACHA_INICIAL');

  const aciertosTema = await repo.contarAciertosPorTema(usuarioId, temaId);
  if (aciertosTema >= 5) candidatos.push('MAESTRO_LOGICA');

  const otorgados = [];
  for (const codigo of candidatos) {
    const logro = await repo.findLogroPorCodigo(codigo);
    if (!logro) continue;
    const nuevo = await withTransaction((client) => repo.otorgarLogro(client, usuarioId, logro.id));
    if (nuevo) {
      otorgados.push({ codigo: logro.codigo, nombre: logro.nombre, puntos: logro.puntos });
    }
  }
  return otorgados;
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

module.exports = { listar, validar, progreso, logros, stats };
