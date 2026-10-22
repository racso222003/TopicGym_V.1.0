'use strict';

const { pool } = require('../config/db');

async function crear({ docenteId, codigo, asignaturaId }) {
  const { rows } = await pool.query(
    `INSERT INTO codigos_clase (docente_id, codigo, activo, asignatura_id)
     VALUES ($1, $2, TRUE, $3)
     RETURNING id, docente_id, codigo, activo, fecha_creacion, asignatura_id`,
    [docenteId, codigo, asignaturaId || null],
  );
  return rows[0];
}

async function listarPorDocente(docenteId) {
  const { rows } = await pool.query(
    `SELECT cc.id, cc.docente_id, cc.codigo, cc.activo, cc.fecha_creacion, cc.asignatura_id,
            a.nombre AS asignatura_nombre, s.numero AS semestre_numero
       FROM codigos_clase cc
       LEFT JOIN asignaturas a ON a.id = cc.asignatura_id
       LEFT JOIN semestres s   ON s.id = a.semestre_id
      WHERE cc.docente_id = $1
      ORDER BY cc.fecha_creacion DESC`,
    [docenteId],
  );
  return rows;
}

async function findActiveByCodigo(codigo) {
  const { rows } = await pool.query(
    `SELECT cc.id, cc.docente_id, cc.codigo, cc.activo, cc.asignatura_id,
            a.nombre AS asignatura_nombre
       FROM codigos_clase cc
       LEFT JOIN asignaturas a ON a.id = cc.asignatura_id
      WHERE UPPER(cc.codigo) = UPPER($1) AND cc.activo = TRUE`,
    [codigo],
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM codigos_clase WHERE id = $1', [id]);
  return rows[0] || null;
}

async function listarAsignaturas() {
  const { rows } = await pool.query(
    `SELECT a.id, a.nombre, a.semestre_id, s.numero AS semestre_numero
       FROM asignaturas a
       LEFT JOIN semestres s ON s.id = a.semestre_id
      ORDER BY s.numero, a.orden, a.id`,
  );
  return rows;
}

module.exports = { crear, listarPorDocente, findActiveByCodigo, findById, listarAsignaturas };
