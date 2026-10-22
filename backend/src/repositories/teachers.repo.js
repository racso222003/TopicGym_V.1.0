'use strict';

const { pool } = require('../config/db');

/**
 * Alumnos vinculados a los códigos activos del docente.
 * Cada fila es (alumno, código): las métricas se calculan solo dentro de la
 * asignatura del código; si el código no tiene asignatura, cuentan todos los temas.
 */
async function getStudentsProgressByDocente(docenteId) {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      cc.id AS codigo_id,
      u.nombre,
      u.correo_institucional AS correo,
      cc.codigo AS codigo_usado,
      cc.asignatura_id,
      a.nombre AS asignatura_nombre,
      (SELECT count(*)::int
         FROM ejercicios e
         JOIN temas t ON t.id = e.tema_id
        WHERE cc.asignatura_id IS NULL OR t.asignatura_id = cc.asignatura_id) AS total_ejercicios,
      (SELECT count(DISTINCT r.ejercicio_id)::int
         FROM respuestas_estudiante r
         JOIN ejercicios e ON e.id = r.ejercicio_id
         JOIN temas t ON t.id = e.tema_id
        WHERE r.usuario_id = u.id AND r.correcta
          AND (cc.asignatura_id IS NULL OR t.asignatura_id = cc.asignatura_id)) AS ejercicios_resueltos,
      (SELECT COALESCE(sum(pe.puntos), 0)::int
         FROM progreso_estudiante pe
         JOIN temas t ON t.id = pe.tema_id
        WHERE pe.usuario_id = u.id
          AND (cc.asignatura_id IS NULL OR t.asignatura_id = cc.asignatura_id)) AS puntos_totales,
      (SELECT max(r.respondido_en) FROM respuestas_estudiante r WHERE r.usuario_id = u.id) AS ultima_actividad,
      COALESCE((
        SELECT json_agg(
                 json_build_object(
                   'codigo',      l.codigo,
                   'nombre',      l.nombre,
                   'descripcion', l.descripcion,
                   'puntos',      l.puntos,
                   'obtenido_en', lo.obtenido_en
                 )
                 ORDER BY lo.obtenido_en DESC
               )
          FROM logros_obtenidos lo
          JOIN logros l ON l.id = lo.logro_id
         WHERE lo.usuario_id = u.id
      ), '[]'::json) AS logros
    FROM estudiantes_docentes ed
    JOIN codigos_clase cc ON cc.id = ed.codigo_id
    JOIN usuarios u       ON u.id  = ed.estudiante_id
    LEFT JOIN asignaturas a ON a.id = cc.asignatura_id
    WHERE cc.docente_id = $1
      AND cc.activo      = TRUE
      AND u.activo       = TRUE
    ORDER BY u.nombre ASC, cc.codigo ASC
    `,
    [docenteId],
  );

  return rows;
}

/** Días distintos (UTC) con actividad, agrupados por alumno. */
async function listDiasActivosDeUsuarios(usuarioIds) {
  const porUsuario = new Map();
  if (usuarioIds.length === 0) return porUsuario;

  const { rows } = await pool.query(
    `SELECT DISTINCT usuario_id, (respondido_en AT TIME ZONE 'UTC')::date::text AS dia
       FROM respuestas_estudiante
      WHERE usuario_id = ANY($1::uuid[])`,
    [usuarioIds],
  );

  for (const { usuario_id: usuarioId, dia } of rows) {
    if (!porUsuario.has(usuarioId)) porUsuario.set(usuarioId, []);
    porUsuario.get(usuarioId).push(dia);
  }
  return porUsuario;
}

/** Comprueba que el alumno pertenece a un código activo de este docente. */
async function getAlumnoCodigoDocente(docenteId, estudianteId, codigoId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.correo_institucional AS correo,
            cc.codigo AS codigo_usado, cc.asignatura_id, a.nombre AS asignatura_nombre
       FROM estudiantes_docentes ed
       JOIN codigos_clase cc ON cc.id = ed.codigo_id
       JOIN usuarios u       ON u.id  = ed.estudiante_id
       LEFT JOIN asignaturas a ON a.id = cc.asignatura_id
      WHERE ed.estudiante_id = $1 AND ed.codigo_id = $2 AND cc.docente_id = $3`,
    [estudianteId, codigoId, docenteId],
  );
  return rows[0] || null;
}

/** Avance del alumno por tema dentro de la asignatura indicada (null = todas). */
async function getTemasProgreso(estudianteId, asignaturaId) {
  const { rows } = await pool.query(
    `SELECT t.id AS tema_id, t.titulo,
            count(DISTINCT e.id)::int AS total_ejercicios,
            count(DISTINCT r.ejercicio_id) FILTER (WHERE r.correcta)::int AS resueltos,
            count(DISTINCT r.ejercicio_id)::int AS intentados
       FROM temas t
       JOIN ejercicios e ON e.tema_id = t.id
       LEFT JOIN respuestas_estudiante r ON r.ejercicio_id = e.id AND r.usuario_id = $1
      WHERE ($2::int IS NULL OR t.asignatura_id = $2)
      GROUP BY t.id, t.titulo, t.orden
      ORDER BY t.orden`,
    [estudianteId, asignaturaId],
  );
  return rows;
}

/** Últimos intentos del alumno dentro de la asignatura indicada (null = todas). */
async function listHistorialAlumno(estudianteId, asignaturaId, limite) {
  const { rows } = await pool.query(
    `SELECT r.id, r.respondido_en, r.correcta, r.intento,
            e.id AS ejercicio_id, e.titulo AS ejercicio, t.titulo AS tema
       FROM respuestas_estudiante r
       JOIN ejercicios e ON e.id = r.ejercicio_id
       JOIN temas t      ON t.id = e.tema_id
      WHERE r.usuario_id = $1
        AND ($2::int IS NULL OR t.asignatura_id = $2)
      ORDER BY r.respondido_en DESC, r.id DESC
      LIMIT $3`,
    [estudianteId, asignaturaId, limite],
  );
  return rows;
}

module.exports = {
  getStudentsProgressByDocente,
  listDiasActivosDeUsuarios,
  getAlumnoCodigoDocente,
  getTemasProgreso,
  listHistorialAlumno,
};
