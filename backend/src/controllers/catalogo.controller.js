'use strict';

const service = require('../services/catalogo.service');

async function semestres(_req, res, next) {
  try {
    res.json({ semestres: await service.semestres() });
  } catch (err) {
    next(err);
  }
}

async function asignaturas(req, res, next) {
  try {
    const asignaturas = await service.asignaturasDeSemestre(req.params.semestreId);
    res.json({ asignaturas });
  } catch (err) {
    next(err);
  }
}

async function temas(req, res, next) {
  try {
    const temas = await service.temasDeAsignatura(req.params.asignaturaId);
    res.json({ temas });
  } catch (err) {
    next(err);
  }
}

async function tema(req, res, next) {
  try {
    res.json({ tema: await service.detalleTema(req.params.temaId) });
  } catch (err) {
    next(err);
  }
}

module.exports = { semestres, asignaturas, temas, tema };
