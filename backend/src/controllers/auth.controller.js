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

module.exports = { login, me, logout };
