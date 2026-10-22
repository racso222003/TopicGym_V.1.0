'use strict';

const service = require('../services/auth.service');
const { COOKIE_NAME } = require('../middlewares/auth');
const config = require('../config/env');

async function login(req, res, next) {
  try {
    const { correo, password } = req.body;
    const { token, usuario } = await service.login(correo, password);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    });
    res.json({ usuario, token });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const usuario = await service.perfil(req.usuario.sub);
    res.json({ usuario });
  } catch (err) {
    next(err);
  }
}

function logout(_req, res) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

async function register(req, res, next) {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const { token } = req.params;
    const result = await service.verifyEmail(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const usuarioId = req.usuario.sub;
    const resultado = await service.updateProfile(usuarioId, req.body || {});
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function vincularCodigo(req, res, next) {
  try {
    const usuarioId = req.usuario.sub;
    const { codigo } = req.body || {};
    const resultado = await service.linkCode(usuarioId, codigo);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function listarMisCodigos(req, res, next) {
  try {
    const usuarioId = req.usuario.sub;
    const resultado = await service.misCodigos(usuarioId);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me, logout, register, verify, updateMe, vincularCodigo, listarMisCodigos };
