'use strict';

const bcrypt = require('bcryptjs');
const usuariosRepo = require('../repositories/usuarios.repo');
const { signToken } = require('../middlewares/auth');

/**
 * Login con correo institucional + contraseña.
 * Devuelve el usuario público y un token JWT.
 */
async function login(correo, password) {
  const usuario = await usuariosRepo.findByEmail(correo);
  if (!usuario || !usuario.activo) {
    const err = new Error('Credenciales inválidas.');
    err.status = 401;
    throw err;
  }
  if (!usuario.password_hash) {
    const err = new Error('Esta cuenta usa SSO (Google/GitHub); no tiene contraseña local.');
    err.status = 400;
    throw err;
  }

  const ok = await bcrypt.compare(password, usuario.password_hash);
  if (!ok) {
    const err = new Error('Credenciales inválidas.');
    err.status = 401;
    throw err;
  }

  const token = signToken({ sub: usuario.id, correo: usuario.correo_institucional, rol: usuario.rol });
  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo_institucional,
      rol: usuario.rol,
    },
  };
}

async function perfil(usuarioId) {
  const usuario = await usuariosRepo.findById(usuarioId);
  if (!usuario) {
    const err = new Error('Usuario no encontrado.');
    err.status = 404;
    throw err;
  }
  // Normaliza el nombre de campo para que coincida con el contrato de la API
  // (login devuelve `correo`; el repositorio expone `correo_institucional`).
  return { ...usuario, correo: usuario.correo_institucional };
}

module.exports = { login, perfil };
