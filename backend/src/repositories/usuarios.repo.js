'use strict';

const { query } = require('../config/db');

/** Busca un usuario por correo institucional (incluye hash para el login). */
async function findByEmail(correo) {
  const { rows } = await query(
    `SELECT u.id, u.nombre, u.correo_institucional, u.password_hash, u.activo,
            r.codigo AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
      WHERE u.correo_institucional = $1`,
    [correo],
  );
  return rows[0] || null;
}

/** Busca un usuario por id (sin exponer el hash). */
async function findById(id) {
  const { rows } = await query(
    `SELECT u.id, u.nombre, u.correo_institucional, u.activo, u.creado_en,
            r.codigo AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
      WHERE u.id = $1`,
    [id],
  );
  return rows[0] || null;
}

/** Crea un usuario (rol por defecto: ESTUDIANTE). */
async function create({ nombre, correo, passwordHash = null, rolCodigo = 'ESTUDIANTE' }) {
  const { rows } = await query(
    `INSERT INTO usuarios (rol_id, nombre, correo_institucional, password_hash)
     VALUES ((SELECT id FROM roles WHERE codigo = $1), $2, $3, $4)
     RETURNING id, nombre, correo_institucional, creado_en`,
    [rolCodigo, nombre, correo, passwordHash],
  );
  return rows[0];
}

module.exports = { findByEmail, findById, create };
