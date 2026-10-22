'use strict';

const codigosRepo = require('../repositories/codigos.repo');
const teachersRepo = require('../repositories/teachers.repo');
const { withTransaction } = require('../config/db');
const { calcularRacha } = require('../utils/racha');
const crypto = require('crypto');

const DIAS_SIN_ACTIVIDAD = 7;
const RACHA_MINIMA = 3;
const MS_POR_DIA = 86400000;
const HISTORIAL_LIMITE = 25;

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

async function eliminarCodigo(docenteId, codigoId) {
  const resultado = await withTransaction((client) =>
    codigosRepo.eliminarPorDocente(client, { docenteId, codigoId }),
  );
  if (!resultado) {
    const err = new Error('Código de clase no encontrado.');
    err.status = 404;
    throw err;
  }
  return resultado;
}

async function listarAsignaturas() {
  return codigosRepo.listarAsignaturas();
}

function clasificarActividad(ultimaActividad, racha) {
  if (!ultimaActividad) return 'INACTIVO';
  const diasDesdeUltima = (Date.now() - new Date(ultimaActividad).getTime()) / MS_POR_DIA;
  if (diasDesdeUltima > DIAS_SIN_ACTIVIDAD) return 'INACTIVO';
  return racha >= RACHA_MINIMA ? 'RACHA' : 'ACTIVO';
}

async function obtenerProgresoEstudiantes(docenteId) {
  const alumnos = await teachersRepo.getStudentsProgressByDocente(docenteId);
  const ids = [...new Set(alumnos.map((alumno) => alumno.id))];
  const diasPorUsuario = await teachersRepo.listDiasActivosDeUsuarios(ids);

  return alumnos.map((alumno) => {
    const racha = calcularRacha(diasPorUsuario.get(alumno.id) || []);
    return {
      ...alumno,
      racha_dias: racha,
      estado_actividad: clasificarActividad(alumno.ultima_actividad, racha),
    };
  });
}

async function obtenerDetalleAlumno(docenteId, estudianteId, codigoId) {
  const alumno = await teachersRepo.getAlumnoCodigoDocente(docenteId, estudianteId, codigoId);
  if (!alumno) {
    const err = new Error('Alumno no encontrado en tus códigos de clase.');
    err.status = 404;
    throw err;
  }

  const [temas, historial] = await Promise.all([
    teachersRepo.getTemasProgreso(estudianteId, alumno.asignatura_id),
    teachersRepo.listHistorialAlumno(estudianteId, alumno.asignatura_id, HISTORIAL_LIMITE),
  ]);

  return {
    alumno,
    temas: temas.map((tema) => ({
      ...tema,
      porcentaje: tema.total_ejercicios > 0 ? Math.round((tema.resueltos / tema.total_ejercicios) * 100) : 0,
    })),
    historial,
  };
}

module.exports = {
  generarCodigo,
  listarCodigos,
  eliminarCodigo,
  listarAsignaturas,
  obtenerProgresoEstudiantes,
  obtenerDetalleAlumno,
};
