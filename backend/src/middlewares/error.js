'use strict';

const { ZodError } = require('zod');

/** Ruta no encontrada. */
function notFound(req, res) {
  res.status(404).json({ error: `Recurso no encontrado: ${req.method} ${req.originalUrl}` });
}

/** Manejador central de errores (debe declararse al final del stack de Express). */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos.',
      detalles: err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }

  const status = err.status || 500;
  if (status >= 500) {
    console.error('[error]', err);
  }
  return res.status(status).json({ error: err.message || 'Error interno del servidor.' });
}

module.exports = { notFound, errorHandler };
