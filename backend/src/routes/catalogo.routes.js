'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/catalogo.controller');
const { validate } = require('../middlewares/validate');
const {
  semestreParamSchema,
  asignaturaParamSchema,
  temaParamSchema,
} = require('../models/entidades');

const router = Router();

router.get('/semesters', ctrl.semestres);
router.get(
  '/semesters/:semestreId/subjects',
  validate({ params: semestreParamSchema }),
  ctrl.asignaturas,
);
router.get(
  '/subjects/:asignaturaId/topics',
  validate({ params: asignaturaParamSchema }),
  ctrl.temas,
);
router.get('/topics/:temaId', validate({ params: temaParamSchema }), ctrl.tema);

module.exports = router;
