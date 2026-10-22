'use strict';

const { query } = require('../config/db');

async function findByCorreo(correoInstitucional) {
  const { rows } = await query(
    `SELECT u.id, u.rol_id, u.nombre, u.correo_institucional, u.password_hash, u.activo, u.email_verificado, r.codigo AS rol_codigo
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE LOWER(u.correo_institucional) = LOWER($1)`,
    [correoInstitucional],
  );
  return rows[0] || null;
}

async function findByEmail(correo) {
  return findByCorreo(correo);
}

async function findById(id) {
  const { rows } = await query(
    `SELECT u.id, u.rol_id, u.nombre, u.correo_institucional, u.activo, u.email_verificado, u.creado_en,
            u.telefono, u.direccion, u.ciudad, r.codigo AS rol_codigo
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.id = $1`,
    [id],
  );
  return rows[0] || null;
}

async function updateProfile(id, { nombre, telefono, direccion, ciudad }) {
  const { rows } = await query(
    `UPDATE usuarios
        SET nombre   = COALESCE(NULLIF(TRIM($2), ''), nombre),
            telefono = $3,
            direccion= $4,
            ciudad   = $5
      WHERE id = $1
    RETURNING id, rol_id, nombre, correo_institucional, activo, email_verificado, creado_en, telefono, direccion, ciudad`,
    [id, nombre ?? null, telefono ?? null, direccion ?? null, ciudad ?? null],
  );
  return rows[0] || null;
}

async function findRoleIdByCodigo(codigo) {
  const { rows } = await query('SELECT id FROM roles WHERE codigo = $1', [codigo]);
  return rows[0]?.id || null;
}

async function createUsuario({ rolId, nombre, correoInstitucional, passwordHash, tokenVerificacion }) {
  const { rows } = await query(
    `INSERT INTO usuarios (rol_id, nombre, correo_institucional, password_hash, activo, email_verificado, token_verificacion)
     VALUES ($1, $2, $3, $4, TRUE, FALSE, $5)
     RETURNING id, rol_id, nombre, correo_institucional, email_verificado, token_verificacion, creado_en`,
    [rolId, nombre, correoInstitucional, passwordHash, tokenVerificacion],
  );
  return rows[0];
}

async function create({ nombre, correo, passwordHash = null, rolCodigo = 'ESTUDIANTE' }) {
  const { rows } = await query(
    `INSERT INTO usuarios (rol_id, nombre, correo_institucional, password_hash)
     VALUES ((SELECT id FROM roles WHERE codigo = $1), $2, $3, $4)
     RETURNING id, nombre, correo_institucional, creado_en`,
    [rolCodigo, nombre, correo, passwordHash],
  );
  return rows[0];
}

async function findByVerificationToken(token) {
  const { rows } = await query(
    `SELECT u.id, u.rol_id, u.nombre, u.correo_institucional, u.email_verificado, r.codigo AS rol_codigo
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.token_verificacion = $1`,
    [token],
  );
  return rows[0] || null;
}

async function verifyEmail(usuarioId) {
  const { rows } = await query(
    `UPDATE usuarios
     SET email_verificado = TRUE,
         token_verificacion = NULL
     WHERE id = $1
       AND email_verificado = FALSE
     RETURNING id, rol_id, nombre, correo_institucional, email_verificado`,
    [usuarioId],
  );
  return rows[0] || null;
}

async function markTokenInvalid(usuarioId) {
  await query('UPDATE usuarios SET token_verificacion = NULL WHERE id = $1', [usuarioId]);
}

module.exports = {
  findByCorreo,
  findByEmail,
  findById,
  findRoleIdByCodigo,
  createUsuario,
  create,
  findByVerificationToken,
  verifyEmail,
  markTokenInvalid,
  updateProfile,
};
