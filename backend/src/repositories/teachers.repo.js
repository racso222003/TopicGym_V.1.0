'use strict';

const { pool } = require('../config/db');

async function getStudentsProgressByDocente(docenteId) {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      u.nombre,
      u.correo_institucional AS correo,
      cc.codigo AS codigo_usado,
      cc.asignatura_id,
      a.nombre AS asignatura_nombre,
      COALESCE(SUM(DISTINCT pe.ejercicios_resueltos), 0)::int AS ejercicios_resueltos,
      COALESCE(SUM(DISTINCT pe.puntos), 0)::int                AS puntos_totales,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'codigo',      l.codigo,
            'nombre',      l.nombre,
            'descripcion', l.descripcion,
            'puntos',      l.puntos::int,
            'obtenido_en', lo.obtenido_en
          )
        ) FILTER (WHERE lo.id IS NOT NULL),
        '[]'
      ) AS logros
    FROM estudiantes_docentes ed
    JOIN codigos_clase cc ON cc.id = ed.codigo_id
    JOIN usuarios u       ON u.id  = ed.estudiante_id
    LEFT JOIN asignaturas a ON a.id = cc.asignatura_id
    LEFT JOIN temas t      ON t.asignatura_id = a.id
    LEFT JOIN progreso_estudiante pe ON pe.usuario_id = u.id AND pe.tema_id = t.id
    LEFT JOIN logros_obtenidos lo     ON lo.usuario_id = u.id
    LEFT JOIN logros l               ON l.id          = lo.logro_id
    WHERE cc.docente_id = $1
      AND cc.activo      = TRUE
      AND u.activo       = TRUE
    GROUP BY u.id, u.nombre, u.correo_institucional, cc.codigo, cc.asignatura_id, a.nombre
    ORDER BY u.nombre ASC
    `,
    [docenteId],
  );

  return rows;
}

module.exports = {
  getStudentsProgressByDocente,
};

