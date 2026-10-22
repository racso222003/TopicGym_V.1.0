'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const usuariosRepo = require('../repositories/usuarios.repo');
const codigosRepo = require('../repositories/codigos.repo');
const estudiantesDocentesRepo = require('../repositories/estudiantesDocentes.repo');
const emailService = require('./email.service');
const { signToken } = require('../middlewares/auth');
const config = require('../config/env');

function generarTokenVerificacion() {
  return crypto.randomBytes(32).toString('hex');
}

function signTokenLocal(usuario) {
  return jwt.sign(
    {
      sub: usuario.id,
      rol: usuario.rol_codigo || usuario.rol,
      rol_id: usuario.rol_id,
      correo: usuario.correo_institucional,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

/**
 * Login con correo institucional + contraseña.
 * Devuelve el usuario público y un token JWT.
 */
async function login(correo, password) {
  const usuario = await usuariosRepo.findByCorreo(correo);
  if (!usuario || !usuario.activo) {
    const err = new Error('Credenciales inválidas.');
    err.status = 401;
    throw err;
  }
  if (usuario.email_verificado === false) {
    const err = new Error('Debes verificar tu correo electrónico antes de iniciar sesión');
    err.status = 403;
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

  const token = signTokenLocal(usuario);
  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo_institucional,
      rol: usuario.rol_codigo || usuario.rol,
      rol_id: usuario.rol_id,
      email_verificado: usuario.email_verificado,
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
  return { ...usuario, correo: usuario.correo_institucional, rol: usuario.rol_codigo || usuario.rol };
}

async function register({ nombre, correo, password, rol, codigoClase }) {
  const correoLower = correo.toLowerCase().trim();
  const existente = await usuariosRepo.findByCorreo(correoLower);
  if (existente) {
    const err = new Error('El correo ya se encuentra registrado');
    err.status = 409;
    throw err;
  }

  const rolId = await usuariosRepo.findRoleIdByCodigo(rol);
  if (!rolId) {
    const err = new Error('Rol inválido');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const tokenVerificacion = generarTokenVerificacion();

  const usuario = await usuariosRepo.createUsuario({
    rolId,
    nombre: nombre.trim(),
    correoInstitucional: correoLower,
    passwordHash,
    tokenVerificacion,
  });

  if (rol === 'ESTUDIANTE' && codigoClase && codigoClase.trim() !== '') {
    const codigo = await codigosRepo.findActiveByCodigo(codigoClase.trim());
    if (codigo) {
      try {
        await estudiantesDocentesRepo.vincular({
          estudianteId: usuario.id,
          codigoId: codigo.id,
        });
      } catch (e) {
        // ignore
      }
    }
  }

  let verifyUrl = null;
  try {
    await emailService.sendVerificationEmail(usuario.correo_institucional, tokenVerificacion);
  } catch (e) {
    // ignore
  }
  verifyUrl = `${config.app.baseUrl}/auth/verify/${tokenVerificacion}`;

  return {
    ok: true,
    mensaje: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
    verifyUrl,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo_institucional,
      rol_id: usuario.rol_id,
      email_verificado: usuario.email_verificado,
    },
  };
}

async function updateProfile(usuarioId, datos) {
  const usuario = await usuariosRepo.findById(usuarioId);
  if (!usuario) {
    const err = new Error('Usuario no encontrado.');
    err.status = 404;
    throw err;
  }
  const actualizado = await usuariosRepo.updateProfile(usuarioId, {
    nombre: datos?.nombre,
    telefono: datos?.telefono ?? null,
    direccion: datos?.direccion ?? null,
    ciudad: datos?.ciudad ?? null,
  });
  return {
    ok: true,
    mensaje: 'Perfil actualizado correctamente.',
    usuario: {
      ...actualizado,
      correo: actualizado.correo_institucional,
      rol: usuario.rol_codigo,
    },
  };
}

async function linkCode(usuarioId, codigo) {
  const usuario = await usuariosRepo.findById(usuarioId);
  if (!usuario) {
    const err = new Error('Usuario no encontrado.');
    err.status = 404;
    throw err;
  }
  if (usuario.rol_codigo !== 'ESTUDIANTE') {
    const err = new Error('Solo los estudiantes pueden vincularse a códigos.');
    err.status = 403;
    throw err;
  }
  const codigoInfo = await codigosRepo.findActiveByCodigo(codigo);
  if (!codigoInfo) {
    const err = new Error('Código de clase inválido o inactivo.');
    err.status = 400;
    throw err;
  }
  const yaExiste = await estudiantesDocentesRepo.existeVinculo(usuarioId, codigoInfo.id);
  if (yaExiste) {
    const err = new Error('Ya te encuentras vinculado a este código.');
    err.status = 409;
    throw err;
  }
  await estudiantesDocentesRepo.vincular({ estudianteId: usuarioId, codigoId: codigoInfo.id });
  return {
    ok: true,
    mensaje: 'Te has vinculado correctamente al grupo.',
    codigo: {
      codigo: codigoInfo.codigo,
      asignatura: codigoInfo.asignatura_nombre,
    },
  };
}

async function misCodigos(usuarioId) {
  const codigos = await estudiantesDocentesRepo.listarPorEstudiante(usuarioId);
  return { codigos };
}

async function verifyEmail(token) {
  if (!token) {
    const err = new Error('Token de verificación requerido');
    err.status = 400;
    throw err;
  }
  const usuario = await usuariosRepo.findByVerificationToken(token);
  if (!usuario) {
    const err = new Error('Token de verificación inválido o ya utilizado');
    err.status = 400;
    throw err;
  }
  if (usuario.email_verificado) {
    return {
      ok: true,
      mensaje: 'Tu correo ya fue verificado anteriormente.',
      usuario: {
        id: usuario.id,
        correo: usuario.correo_institucional,
        rol_codigo: usuario.rol_codigo,
      },
    };
  }
  const verificado = await usuariosRepo.verifyEmail(usuario.id);
  if (!verificado) {
    const err = new Error('No fue posible verificar el correo');
    err.status = 400;
    throw err;
  }
  return {
    ok: true,
    mensaje: 'Correo verificado correctamente. Ya puedes iniciar sesión.',
    usuario: {
      id: verificado.id,
      correo: verificado.correo_institucional,
      rol_codigo: usuario.rol_codigo,
    },
  };
}

module.exports = { login, perfil, register, verifyEmail, updateProfile, linkCode, misCodigos };
