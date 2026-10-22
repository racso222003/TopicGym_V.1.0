'use strict';

const codigosRepo = require('../repositories/codigos.repo');
const teachersRepo = require('../repositories/teachers.repo');
const crypto = require('crypto');

function generarCodigoRandom() {
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PROG-${hex}`;
}

async function generarCodigo(docenteId, asignaturaId = null) {
  let codigo;
  let intentos = 0;
  do {
    codigo = generarCodigoRandom();
    const existente = await codigosRepo.findActiveByCodigo(codigo);
    if (!existente) break;
    intentos += 1;
  } while (intentos < 10);
  const creado = await codigosRepo.crear({ docenteId, codigo, asignaturaId });
  return creado;
}

async function listarCodigos(docenteId) {
  return codigosRepo.listarPorDocente(docenteId);
}

async function listarAsignaturas() {
  return codigosRepo.listarAsignaturas();
}

async function obtenerProgresoEstudiantes(docenteId) {
  return teachersRepo.getStudentsProgressByDocente(docenteId);
}

module.exports = {
  generarCodigo,
  listarCodigos,
  listarAsignaturas,
  obtenerProgresoEstudiantes,
};
