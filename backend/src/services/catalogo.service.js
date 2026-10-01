'use strict';

const repo = require('../repositories/catalogo.repo');

function noEncontrado(msg) {
  const err = new Error(msg);
  err.status = 404;
  return err;
}

async function semestres() {
  return repo.listSemesters();
}

async function asignaturasDeSemestre(semestreId) {
  return repo.listSubjectsBySemester(semestreId);
}

async function temasDeAsignatura(asignaturaId) {
  return repo.listTopicsBySubject(asignaturaId);
}

async function detalleTema(temaId) {
  const tema = await repo.getTopicWithVideos(temaId);
  if (!tema) throw noEncontrado(`Tema ${temaId} no encontrado.`);
  return tema;
}

module.exports = { semestres, asignaturasDeSemestre, temasDeAsignatura, detalleTema };
