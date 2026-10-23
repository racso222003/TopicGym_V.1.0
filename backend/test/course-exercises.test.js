'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const raiz = path.join(__dirname, '../..');
const ejerciciosBase = JSON.parse(
  fs.readFileSync(path.join(raiz, 'banco-ejercicios/ejercicios_asignaturas_nuevas.json'), 'utf8'),
);
const ampliacionSemestre1 = JSON.parse(
  fs.readFileSync(path.join(raiz, 'banco-ejercicios/ejercicios_semestre_1_ampliacion.json'), 'utf8'),
);
const ejercicios = [...ejerciciosBase, ...ampliacionSemestre1];

test('el banco nuevo cubre las materias acordadas y completa los temas de Arquitectura y POO', () => {
  assert.equal(ejerciciosBase.length, 65);
  assert.equal(ampliacionSemestre1.length, 60);
  assert.equal(ejercicios.length, 125);

  const porAsignatura = new Map();
  const porDificultad = { FACIL: 0, MEDIO: 0, DIFICIL: 0 };
  for (const ejercicio of ejercicios) {
    porAsignatura.set(ejercicio.asignatura, (porAsignatura.get(ejercicio.asignatura) ?? 0) + 1);
    porDificultad[ejercicio.dificultad] += 1;
  }

  const asignaturasEsperadas = [
    'Arquitectura de Computadores',
    'Programación Orientada a Objetos',
    'Estructura de Datos',
    'Matemática Fundamental',
    'Legislación Informática',
    'Introducción a la Ingeniería de Software',
    'Identidad FET',
    'Técnicas de la Comunicación',
    'Inglés I',
  ].sort();
  assert.deepEqual([...porAsignatura.keys()].sort(), asignaturasEsperadas);
  const cantidadesEsperadas = {
    'Arquitectura de Computadores': 15,
    'Programación Orientada a Objetos': 15,
    'Estructura de Datos': 5,
    'Matemática Fundamental': 15,
    'Legislación Informática': 15,
    'Introducción a la Ingeniería de Software': 15,
    'Identidad FET': 15,
    'Técnicas de la Comunicación': 15,
    'Inglés I': 15,
  };
  for (const [nombre, cantidad] of Object.entries(cantidadesEsperadas)) {
    assert.equal(porAsignatura.get(nombre), cantidad, nombre);
  }
  assert.deepEqual(porDificultad, { FACIL: 42, MEDIO: 41, DIFICIL: 42 });

  const temasConTresNiveles = [
    'Arquitectura de Computadores',
    'Programación Orientada a Objetos',
    'Matemática Fundamental',
    'Legislación Informática',
    'Introducción a la Ingeniería de Software',
    'Identidad FET',
    'Técnicas de la Comunicación',
    'Inglés I',
  ];
  for (const nombre of temasConTresNiveles) {
    const porTema = new Map();
    for (const ejercicio of ejercicios.filter((item) => item.asignatura === nombre)) {
      if (!porTema.has(ejercicio.tema)) porTema.set(ejercicio.tema, []);
      porTema.get(ejercicio.tema).push(ejercicio.dificultad);
    }
    assert.equal(porTema.size, 5, nombre);
    for (const dificultades of porTema.values()) {
      assert.deepEqual(dificultades.sort(), ['DIFICIL', 'FACIL', 'MEDIO']);
    }
  }
});

test('cada ejercicio es autocorregible y tiene cuatro opciones con una única correcta', () => {
  for (const ejercicio of ejercicios) {
    assert.equal(ejercicio.tipo, 'OPCION_MULTIPLE');
    assert.equal(ejercicio.opciones.length, 4, ejercicio.tema);
    assert.equal(ejercicio.opciones.filter((opcion) => opcion.es_correcta).length, 1, ejercicio.tema);
    assert.ok(ejercicio.opciones.every((opcion) => opcion.texto && opcion.explicacion), ejercicio.tema);
  }
});
