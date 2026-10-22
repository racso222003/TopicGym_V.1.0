'use strict';

const { Router } = require('express');
const controller = require('../controllers/teachers.controller');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { detalleAlumnoParamsSchema, codigoIdParamsSchema } = require('../schemas/teachers.schemas');

const router = Router();

router.use(requireAuth, requireRole('DOCENTE'));

router.get('/asignaturas', controller.listarAsignaturas);
router.post('/codes', controller.crearCodigo);
router.get('/codes', controller.listarCodigos);
router.delete('/codes/:codigoId', validate({ params: codigoIdParamsSchema }), controller.eliminarCodigo);
router.get('/students-progress', controller.progresoEstudiantes);
router.get(
  '/students/:estudianteId/codes/:codigoId/detalle',
  validate({ params: detalleAlumnoParamsSchema }),
  controller.detalleAlumno,
);

module.exports = router;
