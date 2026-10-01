'use strict';

const { query } = require('../config/db');

/** Todos los semestres con su estado. */
async function listSemesters() {
  const { rows } = await query(
    `SELECT id, numero, nombre, estado
       FROM semestres
      ORDER BY numero`,
  );
  return rows;
}

/** Asignaturas de un semestre. */
async function listSubjectsBySemester(semestreId) {
  const { rows } = await query(
    `SELECT id, nombre, orden
       FROM asignaturas
      WHERE semestre_id = $1
      ORDER BY orden`,
    [semestreId],
  );
  return rows;
}

/** Temas de una asignatura. */
async function listTopicsBySubject(asignaturaId) {
  const { rows } = await query(
    `SELECT id, titulo, descripcion, dificultad_base, orden
       FROM temas
      WHERE asignatura_id = $1
      ORDER BY orden`,
    [asignaturaId],
  );
  return rows;
}

/** Detalle de un tema con sus videos de apoyo. */
async function getTopicWithVideos(temaId) {
  const tema = await query(
    `SELECT t.id, t.titulo, t.descripcion, t.dificultad_base,
            a.id AS asignatura_id, a.nombre AS asignatura,
            s.numero AS semestre_numero
       FROM temas t
       JOIN asignaturas a ON a.id = t.asignatura_id
       JOIN semestres s ON s.id = a.semestre_id
      WHERE t.id = $1`,
    [temaId],
  );
  if (!tema.rows[0]) return null;

  const videos = await query(
    `SELECT id, titulo, url_youtube, duracion_seg, orden
       FROM videos
      WHERE tema_id = $1
      ORDER BY orden`,
    [temaId],
  );

  return { ...tema.rows[0], videos: videos.rows };
}

module.exports = {
  listSemesters,
  listSubjectsBySemester,
  listTopicsBySubject,
  getTopicWithVideos,
};
