'use strict';

const { Router } = require('express');
const controller = require('../controllers/teachers.controller');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = Router();

router.use(requireAuth, requireRole('DOCENTE'));

router.get('/asignaturas', controller.listarAsignaturas);
router.post('/codes', controller.crearCodigo);
router.get('/codes', controller.listarCodigos);
router.get('/students-progress', controller.progresoEstudiantes);

module.exports = router;
