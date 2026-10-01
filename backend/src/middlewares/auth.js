'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

const COOKIE_NAME = 'token';

function extractToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Adjunta req.usuario si hay un token válido; no bloquea la petición. */
function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.usuario = jwt.verify(token, config.jwt.secret);
    } catch (_e) {
      /* token inválido: se ignora en modo opcional */
    }
  }
  next();
}

/** Exige un token válido. */
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No autenticado: falta el token.' });
  }
  try {
    req.usuario = jwt.verify(token, config.jwt.secret);
    return next();
  } catch (_e) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

/** Restringe el acceso a ciertos roles. Uso: requireRole('DOCENTE', 'ADMIN') */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: 'No autenticado.' });
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No autorizado para este recurso.' });
    }
    return next();
  };
}

function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

module.exports = { optionalAuth, requireAuth, requireRole, signToken, COOKIE_NAME };
