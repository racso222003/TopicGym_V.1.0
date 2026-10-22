'use strict';

const { z } = require('zod');

const emailInstitucionalRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerBodySchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  correo: z
    .string({ required_error: 'El correo es obligatorio' })
    .email('Formato de correo inválido')
    .regex(emailInstitucionalRegex, 'Debe ser un correo válido')
    .max(120, 'El correo no puede exceder 120 caracteres')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
  rol: z.enum(['ESTUDIANTE', 'DOCENTE'], {
    required_error: 'El rol es obligatorio',
    invalid_type_error: 'Rol inválido. Debe ser ESTUDIANTE o DOCENTE',
  }),
  codigoClase: z
    .string()
    .max(20, 'El código de clase no puede exceder 20 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
});

const loginBodySchema = z.object({
  correo: z
    .string({ required_error: 'El correo es obligatorio' })
    .email('Formato de correo inválido')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'La contraseña es obligatoria' }),
});

const verifyParamsSchema = z.object({
  token: z.string({ required_error: 'Token requerido' }).min(10, 'Token inválido'),
});

const registerSchema = { body: registerBodySchema };
const loginSchema = { body: loginBodySchema };
const verifyTokenSchema = { params: verifyParamsSchema };

module.exports = {
  registerSchema,
  loginSchema,
  verifyTokenSchema,
  registerBodySchema,
  loginBodySchema,
  verifyParamsSchema,
};
