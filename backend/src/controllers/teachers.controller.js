'use strict';

const service = require('../services/teachers.service');

async function crearCodigo(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const { asignaturaId } = req.body || {};
    const codigo = await service.generarCodigo(docenteId, asignaturaId || null);
    res.status(201).json({ codigo });
  } catch (err) {
    next(err);
  }
}

async function listarCodigos(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const codigos = await service.listarCodigos(docenteId);
    res.json({ codigos });
  } catch (err) {
    next(err);
  }
}

async function eliminarCodigo(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const { codigoId } = req.params;
    const resultado = await service.eliminarCodigo(docenteId, codigoId);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    next(err);
  }
}

async function listarAsignaturas(req, res, next) {
  try {
    const asignaturas = await service.listarAsignaturas();
    res.json({ asignaturas });
  } catch (err) {
    next(err);
  }
}

async function progresoEstudiantes(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const alumnos = await service.obtenerProgresoEstudiantes(docenteId);
    res.json({ alumnos });
  } catch (err) {
    next(err);
  }
}

async function detalleAlumno(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const { estudianteId, codigoId } = req.params;
    const detalle = await service.obtenerDetalleAlumno(docenteId, estudianteId, codigoId);
    res.json(detalle);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  crearCodigo,
  listarCodigos,
  eliminarCodigo,
  listarAsignaturas,
  progresoEstudiantes,
  detalleAlumno,
};
