'use strict';

const { query } = require('../config/db');

/**
 * Banco de ejercicios de un tema, filtrado opcionalmente por nivel.
 * No expone `es_correcta`: la respuesta correcta solo se conoce en el servidor.
 */
async function listByTopic(temaId, nivel) {
  const params = [temaId];
  let filtro = '';
  if (nivel) {
    params.push(nivel);
    filtro = 'AND e.nivel = $2';
  }

  const { rows } = await query(
    `SELECT e.id, e.nivel, e.tipo, e.titulo, e.enunciado,
            e.codigo_referencia, e.pista, e.puntos_ponderados, e.orden,
            COALESCE(
              json_agg(
                json_build_object('id', o.id, 'texto', o.texto, 'orden', o.orden)
                ORDER BY o.orden
              ) FILTER (WHERE o.id IS NOT NULL), '[]'
            ) AS opciones
       FROM ejercicios e
       LEFT JOIN opciones o ON o.ejercicio_id = e.id
      WHERE e.tema_id = $1 ${filtro}
      GROUP BY e.id
      ORDER BY e.orden`,
    params,
  );
  return rows;
}

/** Ejercicio con sus opciones marcando cuál es correcta (uso interno del servidor). */
async function findWithOpciones(ejercicioId) {
  const { rows } = await query(
    `SELECT e.id, e.tema_id, e.nivel, e.tipo, e.titulo, e.enunciado,
            e.codigo_referencia, e.explicacion, e.pista, e.puntos_ponderados,
            COALESCE(
              json_agg(
                json_build_object('id', o.id, 'texto', o.texto, 'es_correcta', o.es_correcta, 'orden', o.orden)
                ORDER BY o.orden
              ) FILTER (WHERE o.id IS NOT NULL), '[]'
            ) AS opciones
       FROM ejercicios e
       LEFT JOIN opciones o ON o.ejercicio_id = e.id
      WHERE e.id = $1
      GROUP BY e.id`,
    [ejercicioId],
  );
  return rows[0] || null;
}

/** Guarda una respuesta del estudiante. */
async function registrarRespuesta(client, { usuarioId, ejercicioId, opcionId, textoRespuesta, correcta, intento }) {
  const { rows } = await client.query(
    `INSERT INTO respuestas_estudiante
       (usuario_id, ejercicio_id, opcion_id, texto_respuesta, correcta, intento)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, respondido_en`,
    [usuarioId, ejercicioId, opcionId || null, textoRespuesta || null, correcta, intento],
  );
  return rows[0];
}

/** Suma puntos y ejercicios resueltos al progreso del estudiante en el tema. */
async function sumarProgreso(client, { usuarioId, temaId, resuelto, puntos }) {
  const { rows } = await client.query(
    `INSERT INTO progreso_estudiante (usuario_id, tema_id, ejercicios_resueltos, puntos)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (usuario_id, tema_id) DO UPDATE
       SET ejercicios_resueltos = progreso_estudiante.ejercicios_resueltos + EXCLUDED.ejercicios_resueltos,
           puntos               = progreso_estudiante.puntos + EXCLUDED.puntos,
           actualizado_en       = now()
     RETURNING ejercicios_resueltos, puntos`,
    [usuarioId, temaId, resuelto ? 1 : 0, puntos],
  );
  return rows[0];
}

/** Cuenta cuántos intentos previos tiene el estudiante en un ejercicio. */
async function contarIntentos(client, usuarioId, ejercicioId) {
  const { rows } = await client.query(
    `SELECT count(*)::int AS n
       FROM respuestas_estudiante
      WHERE usuario_id = $1 AND ejercicio_id = $2`,
    [usuarioId, ejercicioId],
  );
  return rows[0].n;
}

/** Progreso por tema del estudiante. */
async function getProgreso(usuarioId) {
  const { rows } = await query(
    `SELECT p.tema_id, t.titulo AS tema,
            p.ejercicios_resueltos, p.puntos, p.actualizado_en
       FROM progreso_estudiante p
       JOIN temas t ON t.id = p.tema_id
      WHERE p.usuario_id = $1
      ORDER BY t.orden`,
    [usuarioId],
  );
  return rows;
}

/** Estadísticas agregadas: puntos totales y aciertos. */
async function getResumen(usuarioId) {
  const { rows } = await query(
    `SELECT
       COALESCE((SELECT sum(puntos) FROM progreso_estudiante WHERE usuario_id = $1), 0)::int AS puntos_totales,
       COALESCE((SELECT count(*) FROM respuestas_estudiante WHERE usuario_id = $1 AND correcta), 0)::int AS aciertos,
       COALESCE((SELECT count(*) FROM respuestas_estudiante WHERE usuario_id = $1), 0)::int AS intentos`,
    [usuarioId],
  );
  return rows[0];
}

/** Días (distintos) en que el estudiante respondió ejercicios; para la racha. */
async function listDiasActivos(usuarioId) {
  const { rows } = await query(
    `SELECT DISTINCT (respondido_en AT TIME ZONE 'UTC')::date AS dia
       FROM respuestas_estudiante
      WHERE usuario_id = $1
      ORDER BY dia DESC`,
    [usuarioId],
  );
  return rows.map((r) => r.dia);
}

/** Logros del estudiante (obtenidos y pendientes). */
async function listLogros(usuarioId) {
  const { rows } = await query(
    `SELECT l.id, l.codigo, l.nombre, l.descripcion, l.puntos,
            (lo.id IS NOT NULL) AS obtenido, lo.obtenido_en
       FROM logros l
       LEFT JOIN logros_obtenidos lo
              ON lo.logro_id = l.id AND lo.usuario_id = $1
      ORDER BY l.id`,
    [usuarioId],
  );
  return rows;
}

/** Aciertos en un tema concreto (para el logro "Maestro de lógica"). */
async function contarAciertosPorTema(usuarioId, temaId) {
  const { rows } = await query(
    `SELECT count(DISTINCT r.ejercicio_id)::int AS aciertos
       FROM respuestas_estudiante r
       JOIN ejercicios e ON e.id = r.ejercicio_id
      WHERE r.usuario_id = $1 AND r.correcta AND e.tema_id = $2`,
    [usuarioId, temaId],
  );
  return rows[0].aciertos;
}

/** Otorga un logro si aún no lo tiene. */
async function otorgarLogro(client, usuarioId, logroId) {
  const { rows } = await client.query(
    `INSERT INTO logros_obtenidos (usuario_id, logro_id)
     VALUES ($1, $2)
     ON CONFLICT (usuario_id, logro_id) DO NOTHING
     RETURNING id`,
    [usuarioId, logroId],
  );
  return rows.length > 0;
}

/** Busca un logro por código. */
async function findLogroPorCodigo(codigo) {
  const { rows } = await query(
    `SELECT id, codigo, nombre, puntos FROM logros WHERE codigo = $1`,
    [codigo],
  );
  return rows[0] || null;
}

module.exports = {
  listByTopic,
  findWithOpciones,
  registrarRespuesta,
  sumarProgreso,
  contarIntentos,
  getProgreso,
  getResumen,
  listDiasActivos,
  listLogros,
  contarAciertosPorTema,
  otorgarLogro,
  findLogroPorCodigo,
};
