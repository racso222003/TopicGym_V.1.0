'use strict';

// Modelos y esquemas de entrada del dominio (validación con Zod).

const { z } = require('zod');

const Nivel = z.enum(['FACIL', 'MEDIO', 'DIFICIL']);
const TipoEjercicio = z.enum(['OPCION_MULTIPLE', 'PSEUDOCODIGO']);
const EstadoSemestre = z.enum(['ACTIVO', 'PROXIMAMENTE']);
const RolCodigo = z.enum(['ESTUDIANTE', 'DOCENTE', 'ADMIN']);

const idSchema = z.coerce.number().int().positive();

const inicioSesionSchema = z.object({
  correo: z.string().email('Correo institucional inválido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

const respuestaBodySchema = z.object({
  opcionId: idSchema.optional(),
  textoRespuesta: z.string().trim().max(2000).optional(),
});

const listarEjerciciosSchema = z.object({
  temaId: idSchema,
  nivel: Nivel.optional(),
});

// Esquemas de parámetros de ruta (path params)
const semestreParamSchema = z.object({ semestreId: idSchema });
const asignaturaParamSchema = z.object({ asignaturaId: idSchema });
const temaParamSchema = z.object({ temaId: idSchema });
const ejercicioParamSchema = z.object({ ejercicioId: idSchema });

module.exports = {
  Nivel,
  TipoEjercicio,
  EstadoSemestre,
  RolCodigo,
  idSchema,
  inicioSesionSchema,
  respuestaBodySchema,
  listarEjerciciosSchema,
  semestreParamSchema,
  asignaturaParamSchema,
  temaParamSchema,
  ejercicioParamSchema,
};
