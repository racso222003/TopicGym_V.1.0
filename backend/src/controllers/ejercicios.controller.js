'use strict';

const service = require('../services/ejercicios.service');

async function listar(req, res, next) {
  try {
    const { temaId, nivel } = req.query;
    res.json({ ejercicios: await service.listar(temaId, nivel) });
  } catch (err) {
    next(err);
  }
}

async function validar(req, res, next) {
  try {
    const { opcionId, textoRespuesta } = req.body;
    const resultado = await service.validar({
      usuarioId: req.usuario.sub,
      ejercicioId: req.params.ejercicioId,
      opcionId,
      textoRespuesta,
    });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function progreso(req, res, next) {
  try {
    res.json({ progreso: await service.progreso(req.usuario.sub) });
  } catch (err) {
    next(err);
  }
}

async function logros(req, res, next) {
  try {
    res.json({ logros: await service.logros(req.usuario.sub) });
  } catch (err) {
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    res.json({ stats: await service.stats(req.usuario.sub) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, validar, progreso, logros, stats };
