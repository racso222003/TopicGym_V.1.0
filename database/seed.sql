-- ============================================================================
--  TopicGym v1.0  ·  Compromiso 02 (Acta 02)
--  Datos piloto · Lógica de Programación (1.º semestre)
-- ----------------------------------------------------------------------------
--  Ejecutar después de database/schema.sql:
--    psql -U postgres -d topicgym -f database/seed.sql
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
--  Roles
-- ---------------------------------------------------------------------------
INSERT INTO roles (codigo, nombre, descripcion) VALUES
  ('ESTUDIANTE', 'Estudiante', 'Rol por defecto al registrarse o ingresar por SSO.'),
  ('DOCENTE',    'Docente',    'Administra contenido y revisa progreso del grupo.'),
  ('ADMIN',      'Administrador', 'Gestión técnica de la plataforma.');

-- ---------------------------------------------------------------------------
--  Semestres (1.º y 2.º activos; 3.º y 4.º próximamente)
-- ---------------------------------------------------------------------------
INSERT INTO semestres (numero, nombre, estado) VALUES
  (1, 'Semestre 1', 'ACTIVO'),
  (2, 'Semestre 2', 'ACTIVO'),
  (3, 'Semestre 3', 'PROXIMAMENTE'),
  (4, 'Semestre 4', 'PROXIMAMENTE');

-- ---------------------------------------------------------------------------
--  Asignaturas del 1.º semestre (el piloto es Lógica de Programación)
-- ---------------------------------------------------------------------------
INSERT INTO asignaturas (semestre_id, nombre, orden) VALUES
  (1, 'Lógica de Programación',       1),
  (1, 'Matemáticas Fundamentales',    2),
  (1, 'Introducción a la Ingeniería', 3);

-- ---------------------------------------------------------------------------
--  Temas del piloto (asignatura 1 = Lógica de Programación)
-- ---------------------------------------------------------------------------
INSERT INTO temas (asignatura_id, titulo, descripcion, dificultad_base, orden) VALUES
  (1, 'Variables y tipos de datos',
      'Declaración, asignación y tipos básicos: entero, real, texto y booleano.', 'BASICO', 1),
  (1, 'Operadores y precedencia',
      'Operadores aritméticos y jerarquía de evaluación con paréntesis.', 'BASICO', 2),
  (1, 'Condicionales',
      'Estructuras si / si no, evaluación booleana y primera rama verdadera.', 'INTERMEDIO', 3),
  (1, 'Ciclos',
      'Repetición con mientras y para, contadores y condición de corte.', 'INTERMEDIO', 4),
  (1, 'Arreglos y acumuladores',
      'Colecciones indexadas y uso de acumuladores en el recorrido.', 'INTERMEDIO', 5);

-- ---------------------------------------------------------------------------
--  Videos de apoyo (URL de referencia; el backend no almacena el video)
-- ---------------------------------------------------------------------------
INSERT INTO videos (tema_id, titulo, url_youtube, duracion_seg, orden) VALUES
  (1, 'Variables y tipos de datos desde cero',      'https://www.youtube.com/results?search_query=variables+y+tipos+de+datos+en+programacion+para+principiantes', 620,  1),
  (2, 'Jerarquía y precedencia de operadores',      'https://www.youtube.com/results?search_query=jerarquia+de+operadores+aritmeticos+en+programacion',          725,  1),
  (3, 'Condicionales si / si no explicados',        'https://www.youtube.com/results?search_query=condicionales+if+else+explicados+programacion',                 880,  1),
  (4, 'Ciclos: mientras y para',                    'https://www.youtube.com/results?search_query=ciclos+while+y+for+programacion+ejemplos',                     1085, 1),
  (5, 'Arreglos y ejercicios resueltos',            'https://www.youtube.com/results?search_query=arreglos+arrays+ejercicios+resueltos+programacion',             922,  1);

-- ---------------------------------------------------------------------------
--  Banco piloto: 5 ejercicios con explicación en texto (Compromiso 03)
-- ---------------------------------------------------------------------------
INSERT INTO ejercicios
  (tema_id, nivel, tipo, titulo, enunciado, codigo_referencia, explicacion, pista, puntos_ponderados, orden) VALUES
  (1, 'FACIL', 'OPCION_MULTIPLE', 'Variables y tipos de datos',
      'Si la variable entera edad = 17, ¿qué se muestra con mostrar(edad + 1)?',
      'entero edad = 17\nmostrar(edad + 1)',
      'Al ser un dato entero, el operador + realiza suma aritmética: 17 + 1 = 18. Si la variable fuera texto ("17"), el + concatenaría y daría "171".',
      'Revisa el tipo de dato de la variable.', 10, 1),

  (2, 'FACIL', 'OPCION_MULTIPLE', 'Operadores y precedencia',
      '¿Cuál es el valor de resultado?',
      'resultado = 2 + 3 * 4 - 6 / 3',
      'La multiplicación y la división se evalúan antes: 3 * 4 = 12 y 6 / 3 = 2. Luego, de izquierda a derecha: 2 + 12 - 2 = 12.',
      'Multiplicación y división tienen mayor precedencia que suma y resta.', 10, 2),

  (3, 'MEDIO', 'OPCION_MULTIPLE', 'Condicionales: primera rama verdadera',
      'Con nota = 3.0, ¿qué mensaje se muestra?',
      'si (nota >= 4.0) entonces
    mostrar("Aprobado")
si no si (nota >= 3.0) entonces
    mostrar("Aprobado con seguimiento")
si no
    mostrar("Reprobado")
fin si',
      'La primera condición (3.0 >= 4.0) es falsa. La segunda (3.0 >= 3.0) es verdadera, así que se ejecuta su bloque y el resto se omite: "Aprobado con seguimiento".',
      'El programa se detiene en la primera condición verdadera.', 25, 3),

  (4, 'MEDIO', 'OPCION_MULTIPLE', 'Ciclos: número de iteraciones',
      '¿Cuántas veces se ejecuta el cuerpo del ciclo?',
      'contador = 0
mientras (contador < 5) hacer
    mostrar(contador)
    contador = contador + 2
fin mientras',
      'contador toma los valores 0, 2 y 4 (tres iteraciones). Al llegar a 6 la condición 6 < 5 es falsa y el ciclo termina: 3 veces.',
      'Anota el valor de contador en cada vuelta.', 25, 4),

  (5, 'DIFICIL', 'OPCION_MULTIPLE', 'Arreglos y acumulador',
      '¿Cuál es el valor de suma al terminar el recorrido?',
      'numeros = [4, 8, 1, 6]
suma = 0
para cada n en numeros hacer
    suma = suma + n
fin para',
      'El acumulador empieza en 0 y suma cada elemento: 4 + 8 + 1 + 6 = 19.',
      'Suma todos los elementos del arreglo partiendo de 0.', 50, 5);

-- Opciones de respuesta (la opción correcta se marca con es_correcta = TRUE)
INSERT INTO opciones (ejercicio_id, texto, es_correcta, orden) VALUES
  -- Ejercicio 1
  (1, '171',           FALSE, 1),
  (1, '18',            TRUE,  2),
  (1, '17 + 1',        FALSE, 3),
  (1, 'Error de tipos',FALSE, 4),
  -- Ejercicio 2
  (2, '12', TRUE,  1),
  (2, '10', FALSE, 2),
  (2, '20', FALSE, 3),
  (2, '8',  FALSE, 4),
  -- Ejercicio 3
  (3, 'Aprobado',                        FALSE, 1),
  (3, 'Aprobado con seguimiento',        TRUE,  2),
  (3, 'Reprobado',                       FALSE, 3),
  (3, 'No muestra nada',                 FALSE, 4),
  -- Ejercicio 4
  (4, '2 veces',        FALSE, 1),
  (4, '3 veces',        TRUE,  2),
  (4, '5 veces',        FALSE, 3),
  (4, 'Infinitas veces',FALSE, 4),
  -- Ejercicio 5
  (5, '4',  FALSE, 1),
  (5, '19', TRUE,  2),
  (5, '10', FALSE, 3),
  (5, '20', FALSE, 4);

-- ---------------------------------------------------------------------------
--  Logros del piloto
-- ---------------------------------------------------------------------------
INSERT INTO logros (codigo, nombre, descripcion, condicion, puntos) VALUES
  ('PRIMER_ACIERTO', 'Primer acierto',      'Resuelve correctamente tu primer ejercicio.',        '{"aciertos_min": 1}'::jsonb,   5),
  ('PRIMERA_SERIE',  'Primera serie',       'Resuelve 10 ejercicios correctamente.',              '{"aciertos_min": 10}'::jsonb, 20),
  ('RACHA_INICIAL',  'Racha inicial',       'Mantén una racha de 3 días consecutivos.',           '{"racha_dias": 3}'::jsonb,    15),
  ('MAESTRO_LOGICA', 'Maestro de lógica',   'Acierta los 5 ejercicios del piloto de Lógica.',     '{"tema_id": 1, "aciertos": 5}'::jsonb, 50);

-- ---------------------------------------------------------------------------
--  Usuarios demo
--  El password_hash real se genera con backend/seed.js (bcrypt) o al registrar
--  por la API. Ejemplo (contraseña "TopicGym2026") — reemplazar por el hash real:
-- ---------------------------------------------------------------------------
-- INSERT INTO usuarios (rol_id, nombre, correo_institucional, password_hash)
-- VALUES (1, 'Estudiante Demo', 'demo.estudiante@institucion.edu.co', '<hash_bcrypt>');

COMMIT;

-- ============================================================================
--  Fin del seed. Verificación rápida:
--    SELECT count(*) FROM ejercicios;            -- 5
--    SELECT e.titulo, count(o.id) FROM ejercicios e JOIN opciones o ON o.ejercicio_id = e.id GROUP BY e.id ORDER BY e.id;
-- ============================================================================
