'use strict';

const { z } = require('zod');
const { idSchema } = require('../models/entidades');

const detalleAlumnoParamsSchema = z.object({
  estudianteId: z.string().uuid(),
  codigoId: idSchema,
});

const codigoIdParamsSchema = z.object({ codigoId: idSchema });

module.exports = { detalleAlumnoParamsSchema, codigoIdParamsSchema };
