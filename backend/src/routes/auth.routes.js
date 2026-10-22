'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const { inicioSesionSchema } = require('../models/entidades');
const { registerSchema, verifyTokenSchema } = require('../schemas/auth.schemas');
const config = require('../config/env');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs || config.rateLimit.loginWindowMs,
  limit: config.rateLimit.authMax || config.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta más tarde.' },
});

router.post('/login', loginLimiter, validate({ body: inicioSesionSchema }), ctrl.login);
router.post('/register', validate(registerSchema), ctrl.register);
router.get('/verify/:token', validate(verifyTokenSchema), ctrl.verify);
router.get('/me', requireAuth, ctrl.me);
router.patch('/me', requireAuth, ctrl.updateMe);
router.put('/me', requireAuth, ctrl.updateMe);
router.get('/mis-codigos', requireAuth, ctrl.listarMisCodigos);
router.post('/link-code', requireAuth, ctrl.vincularCodigo);
router.post('/logout', ctrl.logout);

module.exports = router;
