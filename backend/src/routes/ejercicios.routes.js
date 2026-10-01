'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/ejercicios.controller');
const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const {
  listarEjerciciosSchema,
  respuestaBodySchema,
  ejercicioParamSchema,
} = require('../models/entidades');

const router = Router();

router.get('/', requireAuth, validate({ query: listarEjerciciosSchema }), ctrl.listar);
router.post(
  '/:ejercicioId/validate',
  requireAuth,
  validate({ params: ejercicioParamSchema, body: respuestaBodySchema }),
  ctrl.validar,
);

module.exports = router;
