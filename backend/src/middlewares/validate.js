'use strict';

// Validación de entrada con Zod.
// Uso A (formato proyecto): router.post('/', validate({ body: esquema }), controlador)
// Uso B (ZodObject directo):  router.post('/', validate(esquema), controlador)
//   En el caso B el esquema se aplica al body completo.

function validate(schemas) {
  const esZodObject =
    schemas && typeof schemas.parse === 'function' && typeof schemas.shape === 'object';

  return (req, _res, next) => {
    try {
      if (esZodObject) {
        req.body = schemas.parse(req.body);
        return next();
      }
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
