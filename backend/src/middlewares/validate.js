'use strict';

// Validación de entrada con Zod.
// Uso: router.post('/', validate({ body: esquema }), controlador)

function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      return next();
    } catch (err) {
      return next(err); // lo normaliza errorHandler
    }
  };
}

module.exports = { validate };
