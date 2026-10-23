-- ============================================================================
-- TopicGym · Migración 006: catálogo de asignaturas para semestres 1–4
-- Ejecutar desde la raíz del proyecto:
--   psql -U postgres -d topicgym -f database/migrations/006_catalogo_semestres_1_4.sql
-- Idempotente y no destructiva: conserva IDs, temas, ejercicios y progreso.
-- ============================================================================

BEGIN;

INSERT INTO semestres (numero, nombre, estado) VALUES
  (1, 'Semestre 1', 'ACTIVO'),
  (2, 'Semestre 2', 'ACTIVO'),
  (3, 'Semestre 3', 'ACTIVO'),
  (4, 'Semestre 4', 'ACTIVO')
ON CONFLICT (numero) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      estado = 'ACTIVO';

-- Ajusta los nombres heredados sin cambiar los IDs de las asignaturas.
UPDATE asignaturas a
   SET nombre = 'Matemática Fundamental', orden = 1
  FROM semestres s
 WHERE a.semestre_id = s.id
   AND s.numero = 1
   AND a.nombre = 'Matemáticas Fundamentales';

UPDATE asignaturas a
   SET nombre = 'Introducción a la Ingeniería de Software', orden = 4
  FROM semestres s
 WHERE a.semestre_id = s.id
   AND s.numero = 1
   AND a.nombre = 'Introducción a la Ingeniería';

-- Falla de forma explícita si la referencia del piloto ya fue alterada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM asignaturas a
      JOIN semestres s ON s.id = a.semestre_id
     WHERE a.id = 1
       AND a.nombre = 'Lógica de Programación'
       AND s.numero = 1
  ) THEN
    RAISE EXCEPTION 'No se encontró Lógica de Programación con ID 1; se cancela para proteger el banco piloto.';
  END IF;
END $$;

UPDATE asignaturas SET orden = 3 WHERE id = 1;

WITH cursos(semestre_numero, nombre, orden) AS (
  VALUES
    (1, 'Matemática Fundamental', 1),
    (1, 'Legislación Informática', 2),
    (1, 'Lógica de Programación', 3),
    (1, 'Introducción a la Ingeniería de Software', 4),
    (1, 'Arquitectura de Computadores', 5),
    (1, 'Identidad FET', 6),
    (1, 'Técnicas de la Comunicación', 7),
    (1, 'Inglés I', 8),
    (2, 'Física 1', 1),
    (2, 'Interfaces I', 2),
    (2, 'Ensamble y Mantenimiento de Computadores I', 3),
    (2, 'Programación Orientada a Objetos', 4),
    (2, 'Sistemas Operativos I', 5),
    (2, 'Electiva', 6),
    (2, 'Epistemología', 7),
    (3, 'Álgebra Lineal', 1),
    (3, 'Física 2', 2),
    (3, 'Estadística y Probabilidad', 3),
    (3, 'Electrónica Básica', 4),
    (3, 'Lenguaje de Programación I', 5),
    (3, 'Introducción a las Bases de Datos', 6),
    (3, 'Estructura de Datos', 7),
    (3, 'Sistemas Operativos II', 8),
    (3, 'Metodologías para el Desarrollo de Software', 9),
    (3, 'Emprendimiento I', 10),
    (4, 'Cálculo Diferencial', 1),
    (4, 'Lenguaje de Programación II', 2),
    (4, 'Redes y Comunicaciones I', 3),
    (4, 'Modelado de Bases de Datos', 4),
    (4, 'Opción de Grado I', 5),
    (4, 'Optativa I', 6),
    (4, 'Electiva de Formación Complementaria', 7),
    (4, 'Metodología de la Investigación', 8),
    (4, 'Inglés II', 9)
)
INSERT INTO asignaturas (semestre_id, nombre, orden)
SELECT s.id, c.nombre, c.orden
  FROM cursos c
  JOIN semestres s ON s.numero = c.semestre_numero
 WHERE NOT EXISTS (
   SELECT 1
     FROM asignaturas a
    WHERE a.semestre_id = s.id
      AND LOWER(a.nombre) = LOWER(c.nombre)
 );

-- Mantiene el orden curricular si la migración se vuelve a ejecutar.
WITH cursos(semestre_numero, nombre, orden) AS (
  VALUES
    (1, 'Matemática Fundamental', 1), (1, 'Legislación Informática', 2),
    (1, 'Lógica de Programación', 3), (1, 'Introducción a la Ingeniería de Software', 4),
    (1, 'Arquitectura de Computadores', 5), (1, 'Identidad FET', 6),
    (1, 'Técnicas de la Comunicación', 7), (1, 'Inglés I', 8),
    (2, 'Física 1', 1), (2, 'Interfaces I', 2),
    (2, 'Ensamble y Mantenimiento de Computadores I', 3),
    (2, 'Programación Orientada a Objetos', 4), (2, 'Sistemas Operativos I', 5),
    (2, 'Electiva', 6), (2, 'Epistemología', 7),
    (3, 'Álgebra Lineal', 1), (3, 'Física 2', 2),
    (3, 'Estadística y Probabilidad', 3), (3, 'Electrónica Básica', 4),
    (3, 'Lenguaje de Programación I', 5), (3, 'Introducción a las Bases de Datos', 6),
    (3, 'Estructura de Datos', 7), (3, 'Sistemas Operativos II', 8),
    (3, 'Metodologías para el Desarrollo de Software', 9), (3, 'Emprendimiento I', 10),
    (4, 'Cálculo Diferencial', 1), (4, 'Lenguaje de Programación II', 2),
    (4, 'Redes y Comunicaciones I', 3), (4, 'Modelado de Bases de Datos', 4),
    (4, 'Opción de Grado I', 5), (4, 'Optativa I', 6),
    (4, 'Electiva de Formación Complementaria', 7),
    (4, 'Metodología de la Investigación', 8), (4, 'Inglés II', 9)
)
UPDATE asignaturas a
   SET orden = c.orden
  FROM cursos c
  JOIN semestres s ON s.numero = c.semestre_numero
 WHERE a.semestre_id = s.id
   AND a.nombre = c.nombre;

COMMIT;
