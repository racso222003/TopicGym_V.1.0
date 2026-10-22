'use strict';

const { pool } = require('../config/db');

async function vincular({ estudianteId, codigoId }) {
  const { rows } = await pool.query(
    `INSERT INTO estudiantes_docentes (estudiante_id, codigo_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING estudiante_id, codigo_id, fecha_vinculacion`,
    [estudianteId, codigoId],
  );
  return rows[0] || null;
}

async function listarPorEstudiante(estudianteId) {
  const { rows } = await pool.query(
    `SELECT ed.estudiante_id, ed.codigo_id, ed.fecha_vinculacion,
            cc.codigo, cc.activo, cc.asignatura_id,
            a.nombre AS asignatura_nombre,
            u.nombre AS docente_nombre, u.correo_institucional AS docente_correo
       FROM estudiantes_docentes ed
       JOIN codigos_clase cc ON cc.id = ed.codigo_id
       JOIN usuarios u       ON u.id  = cc.docente_id
       LEFT JOIN asignaturas a ON a.id = cc.asignatura_id
      WHERE ed.estudiante_id = $1
      ORDER BY ed.fecha_vinculacion ASC`,
    [estudianteId],
  );
  return rows;
}

async function existeVinculo(estudianteId, codigoId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM estudiantes_docentes WHERE estudiante_id = $1 AND codigo_id = $2`,
    [estudianteId, codigoId],
  );
  return rows.length > 0;
}

module.exports = { vincular, listarPorEstudiante, existeVinculo };
