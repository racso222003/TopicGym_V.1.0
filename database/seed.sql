-- ============================================================================
--  TopicGym v1.0  ·  Compromiso 02 (Acta 02) · ampliado en Acta 06 (Compromiso 04)
--  Datos piloto · Lógica de Programación (1.º semestre) · 15 ejercicios
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
--  Semestres 1–4 disponibles en el catálogo
-- ---------------------------------------------------------------------------
INSERT INTO semestres (numero, nombre, estado) VALUES
  (1, 'Semestre 1', 'ACTIVO'),
  (2, 'Semestre 2', 'ACTIVO'),
  (3, 'Semestre 3', 'ACTIVO'),
  (4, 'Semestre 4', 'ACTIVO');

-- ---------------------------------------------------------------------------
--  Asignaturas de los cuatro semestres.
--  Lógica de Programación conserva explícitamente el ID 1: los temas del
--  piloto y los códigos de clase actuales dependen de esta referencia.
-- ---------------------------------------------------------------------------
INSERT INTO asignaturas (id, semestre_id, nombre, orden) VALUES
  -- Semestre 1 (ID 1 reservado para el piloto de Lógica)
  (2,  1, 'Matemática Fundamental', 1),
  (4,  1, 'Legislación Informática', 2),
  (1,  1, 'Lógica de Programación', 3),
  (3,  1, 'Introducción a la Ingeniería de Software', 4),
  (5,  1, 'Arquitectura de Computadores', 5),
  (6,  1, 'Identidad FET', 6),
  (7,  1, 'Técnicas de la Comunicación', 7),
  (8,  1, 'Inglés I', 8),
  -- Semestre 2
  (9,  2, 'Física 1', 1),
  (10, 2, 'Interfaces I', 2),
  (11, 2, 'Ensamble y Mantenimiento de Computadores I', 3),
  (12, 2, 'Programación Orientada a Objetos', 4),
  (13, 2, 'Sistemas Operativos I', 5),
  (14, 2, 'Electiva', 6),
  (15, 2, 'Epistemología', 7),
  -- Semestre 3
  (16, 3, 'Álgebra Lineal', 1),
  (17, 3, 'Física 2', 2),
  (18, 3, 'Estadística y Probabilidad', 3),
  (19, 3, 'Electrónica Básica', 4),
  (20, 3, 'Lenguaje de Programación I', 5),
  (21, 3, 'Introducción a las Bases de Datos', 6),
  (22, 3, 'Estructura de Datos', 7),
  (23, 3, 'Sistemas Operativos II', 8),
  (24, 3, 'Metodologías para el Desarrollo de Software', 9),
  (25, 3, 'Emprendimiento I', 10),
  -- Semestre 4
  (26, 4, 'Cálculo Diferencial', 1),
  (27, 4, 'Lenguaje de Programación II', 2),
  (28, 4, 'Redes y Comunicaciones I', 3),
  (29, 4, 'Modelado de Bases de Datos', 4),
  (30, 4, 'Opción de Grado I', 5),
  (31, 4, 'Optativa I', 6),
  (32, 4, 'Electiva de Formación Complementaria', 7),
  (33, 4, 'Metodología de la Investigación', 8),
  (34, 4, 'Inglés II', 9);

SELECT setval(pg_get_serial_sequence('asignaturas', 'id'), (SELECT MAX(id) FROM asignaturas), TRUE);

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
--  Banco de ejercicios: 15 ejercicios (3 por tema: FÁCIL/MEDIO/DIFÍCIL) · Acta 06
-- ---------------------------------------------------------------------------
INSERT INTO ejercicios
  (tema_id, nivel, tipo, titulo, enunciado, codigo_referencia, explicacion, pista, puntos_ponderados, orden) VALUES
  (1, 'FACIL', 'OPCION_MULTIPLE', 'Variables y tipos de datos',
      'Si la variable entera edad es 17, ¿qué se muestra al ejecutar Escribir edad + 1?',
      'Definir edad Como Entero
edad <- 17
Escribir edad + 1',
      'Al ser un dato entero, el operador + realiza suma aritmética: 17 + 1 = 18. Si la variable fuera texto ("17"), el + concatenaría y daría "171".',
      'Revisa el tipo de dato de la variable.', 10, 1),

  (1, 'MEDIO', 'OPCION_MULTIPLE', 'Conversión real a entero (truncamiento)',
      'Si precio es 19.99, ¿qué muestra al ejecutar Escribir Trunc(precio)?',
      'Definir precio Como Real
precio <- 19.99
Escribir Trunc(precio)',
      'Convertir un real a entero elimina la parte decimal (truncamiento hacia cero): 19.99 se convierte en 19. No redondea a 20.',
      'La conversión no redondea: corta la parte decimal.', 25, 2),

  (1, 'DIFICIL', 'OPCION_MULTIPLE', 'Conversión de texto a número',
      '¿Qué valor muestra el programa?',
      'Definir texto Como Cadena
Definir numero Como Entero
texto <- "6"
numero <- ConvertirANumero(texto)
Escribir numero + 4',
      'Se convierte el texto "6" al número entero 6 y luego se suma: 6 + 4 = 10. Sin la conversión, la suma de textos daría "64".',
      'El texto se convierte a número antes de sumar.', 50, 3),

  (2, 'FACIL', 'OPCION_MULTIPLE', 'Operadores y precedencia',
      '¿Cuál es el valor de resultado?',
      'Definir resultado Como Real
resultado <- 2 + 3 * 4 - 6 / 3
Escribir resultado',
      'La multiplicación y la división se evalúan antes: 3 * 4 = 12 y 6 / 3 = 2. Luego, de izquierda a derecha: 2 + 12 - 2 = 12.',
      'Multiplicación y división tienen mayor precedencia que suma y resta.', 10, 4),

  (2, 'MEDIO', 'OPCION_MULTIPLE', 'Operador módulo (residuo)',
      '¿Cuál es el valor de resto?',
      'Definir resto Como Entero
resto <- 15 mod 4
Escribir resto',
      'El módulo (mod) devuelve el residuo de la división entera: 15 ÷ 4 = 3 con residuo 3, por lo que resto = 3.',
      'Divide 15 entre 4 y quédate con el residuo.', 25, 5),

  (2, 'DIFICIL', 'OPCION_MULTIPLE', 'Precedencia combinada con módulo',
      '¿Cuál es el valor de resultado?',
      'Definir resultado Como Real
resultado <- 10 mod 3 * 2 + 8 / 4
Escribir resultado',
      'Módulo, multiplicación y división se evalúan antes de la suma: 10 mod 3 = 1; 1 * 2 = 2; 8 / 4 = 2. Luego 2 + 2 = 4.',
      'Agrupa primero mod, * y /.', 50, 6),

  (3, 'FACIL', 'OPCION_MULTIPLE', 'Condicional simple',
      'Con edad = 17, ¿qué mensaje se muestra?',
      'Si edad >= 18 Entonces
    Escribir "Mayor de edad"
SiNo
    Escribir "Menor de edad"
FinSi',
      'La condición 17 >= 18 es falsa, así que se ejecuta la rama si no: "Menor de edad".',
      'Compara la edad con 18.', 10, 7),

  (3, 'MEDIO', 'OPCION_MULTIPLE', 'Condicionales: primera rama verdadera',
      'Con nota = 3.0, ¿qué mensaje se muestra?',
      'Si nota >= 4.0 Entonces
    Escribir "Aprobado"
SiNo
    Si nota >= 3.0 Entonces
        Escribir "Aprobado con seguimiento"
    SiNo
        Escribir "Reprobado"
    FinSi
FinSi',
      'La primera condición (3.0 >= 4.0) es falsa. La segunda (3.0 >= 3.0) es verdadera, así que se ejecuta su bloque y el resto se omite: "Aprobado con seguimiento".',
      'El programa se detiene en la primera condición verdadera.', 25, 8),

  (3, 'DIFICIL', 'OPCION_MULTIPLE', 'Condición compuesta con operadores lógicos',
      'Con nota = 4.1, ¿qué mensaje se muestra?',
      'Definir nota Como Real
nota <- 4.1
Si nota >= 0 Y nota <= 5 Y nota >= 4.0 Entonces
    Escribir "Excelente"
SiNo
    Escribir "Rango inválido"
FinSi',
      'Las tres condiciones son verdaderas: nota está en el rango 0-5 y además es 4.1 >= 4.0, por lo que se muestra "Excelente".',
      'Evalúa cada parte del Y (todas deben ser verdaderas).', 50, 9),

  (4, 'FACIL', 'OPCION_MULTIPLE', 'Ciclo para: suma de 1 a 3',
      '¿Cuál es el valor de suma al finalizar?',
      'Definir suma, i Como Entero
suma <- 0
Para i <- 1 Hasta 3 Con Paso 1 Hacer
    suma <- suma + i
FinPara
Escribir suma',
      'El ciclo suma 1, 2 y 3 en cada vuelta: 0 + 1 + 2 + 3 = 6.',
      'Suma los números del 1 al 3.', 10, 10),

  (4, 'MEDIO', 'OPCION_MULTIPLE', 'Ciclos: número de iteraciones',
      '¿Cuántas veces se ejecuta el cuerpo del ciclo?',
      'Definir contador Como Entero
contador <- 0
Mientras contador < 5 Hacer
    Escribir contador
    contador <- contador + 2
FinMientras',
      'contador toma los valores 0, 2 y 4 (tres iteraciones). Al llegar a 6 la condición 6 < 5 es falsa y el ciclo termina: 3 veces.',
      'Anota el valor de contador en cada vuelta.', 25, 11),

  (4, 'DIFICIL', 'OPCION_MULTIPLE', 'Ciclo con condición de corte',
      '¿Cuántas veces se ejecuta el cuerpo del ciclo?',
      'Definir acumulado, veces Como Entero
acumulado <- 0
veces <- 0
Mientras acumulado < 10 Hacer
    acumulado <- acumulado + 4
    veces <- veces + 1
FinMientras',
      'acumulado toma los valores 4, 8 y luego 12 (que ya no es menor que 10), por lo que el cuerpo se ejecuta 3 veces.',
      'Suma de 4 en 4 hasta alcanzar o superar 10.', 50, 12),

  (5, 'FACIL', 'OPCION_MULTIPLE', 'Contar pares en un arreglo',
      '¿Cuántos números pares hay en el arreglo?',
      'Definir numeros Como Entero
Dimension numeros[4]
numeros[1] <- 3
numeros[2] <- 8
numeros[3] <- 5
numeros[4] <- 2
Definir cuantos Como Entero
cuantos <- 0
Para Cada n De numeros Hacer
    Si n mod 2 = 0 Entonces
        cuantos <- cuantos + 1
    FinSi
FinPara
Escribir cuantos',
      '8 y 2 son pares (al dividirlos entre 2 el residuo es 0): cuantos = 2.',
      'Un número es par si n mod 2 = 0.', 10, 13),

  (5, 'MEDIO', 'OPCION_MULTIPLE', 'Actualizar un elemento del arreglo',
      '¿Cuál es el valor final en la segunda posición del arreglo?',
      'Definir numeros Como Entero
Dimension numeros[3]
numeros[1] <- 10
numeros[2] <- 20
numeros[3] <- 30
numeros[2] <- numeros[2] * 2
Escribir numeros[2]',
      'Se duplica el valor de la segunda posición del arreglo: 20 * 2 = 40.',
      'En PSeInt el primer elemento del arreglo ocupa la posición 1.', 25, 14),

  (5, 'DIFICIL', 'OPCION_MULTIPLE', 'Arreglos y acumulador',
      '¿Cuál es el valor de suma al terminar el recorrido?',
      'Definir numeros Como Entero
Dimension numeros[4]
numeros[1] <- 4
numeros[2] <- 8
numeros[3] <- 1
numeros[4] <- 6
Definir suma, n Como Entero
suma <- 0
Para Cada n De numeros Hacer
    suma <- suma + n
FinPara
Escribir suma',
      'El acumulador empieza en 0 y suma cada elemento: 4 + 8 + 1 + 6 = 19.',
      'Suma todos los elementos del arreglo partiendo de 0.', 50, 15);

-- Opciones de respuesta (la opción correcta se marca con es_correcta = TRUE)
INSERT INTO opciones (ejercicio_id, texto, es_correcta, orden) VALUES
  -- Ejercicio 1 (FÁCIL · Variables)
  (1, '171',            FALSE, 1),
  (1, '18',             TRUE,  2),
  (1, '17 + 1',         FALSE, 3),
  (1, 'Error de tipos', FALSE, 4),
  -- Ejercicio 2 (MEDIO · Variables)
  (2, '19',    TRUE,  1),
  (2, '20',    FALSE, 2),
  (2, '19.99', FALSE, 3),
  (2, 'Error de tipos', FALSE, 4),
  -- Ejercicio 3 (DIFÍCIL · Variables)
  (3, '10',    TRUE,  1),
  (3, '"64"',  FALSE, 2),
  (3, '6 + 4', FALSE, 3),
  (3, 'Error de tipos', FALSE, 4),
  -- Ejercicio 4 (FÁCIL · Operadores)
  (4, '12', TRUE,  1),
  (4, '10', FALSE, 2),
  (4, '20', FALSE, 3),
  (4, '8',  FALSE, 4),
  -- Ejercicio 5 (MEDIO · Operadores)
  (5, '3',  TRUE,  1),
  (5, '4',  FALSE, 2),
  (5, '11', FALSE, 3),
  (5, '0',  FALSE, 4),
  -- Ejercicio 6 (DIFÍCIL · Operadores)
  (6, '4',  TRUE,  1),
  (6, '7',  FALSE, 2),
  (6, '10', FALSE, 3),
  (6, '3',  FALSE, 4),
  -- Ejercicio 7 (FÁCIL · Condicionales)
  (7, 'Menor de edad',   TRUE,  1),
  (7, 'Mayor de edad',   FALSE, 2),
  (7, 'No muestra nada', FALSE, 3),
  (7, 'Error de sintaxis', FALSE, 4),
  -- Ejercicio 8 (MEDIO · Condicionales)
  (8, 'Aprobado',                 FALSE, 1),
  (8, 'Aprobado con seguimiento', TRUE,  2),
  (8, 'Reprobado',                FALSE, 3),
  (8, 'No muestra nada',          FALSE, 4),
  -- Ejercicio 9 (DIFÍCIL · Condicionales)
  (9, 'Excelente',        TRUE,  1),
  (9, 'Rango inválido',   FALSE, 2),
  (9, 'No muestra nada',  FALSE, 3),
  (9, 'Error de sintaxis', FALSE, 4),
  -- Ejercicio 10 (FÁCIL · Ciclos)
  (10, '6', TRUE,  1),
  (10, '3', FALSE, 2),
  (10, '7', FALSE, 3),
  (10, '9', FALSE, 4),
  -- Ejercicio 11 (MEDIO · Ciclos)
  (11, '2 veces',         FALSE, 1),
  (11, '3 veces',         TRUE,  2),
  (11, '5 veces',         FALSE, 3),
  (11, 'Infinitas veces', FALSE, 4),
  -- Ejercicio 12 (DIFÍCIL · Ciclos)
  (12, '3 veces',          TRUE,  1),
  (12, '2 veces',          FALSE, 2),
  (12, '4 veces',          FALSE, 3),
  (12, 'No termina nunca', FALSE, 4),
  -- Ejercicio 13 (FÁCIL · Arreglos)
  (13, '2', TRUE,  1),
  (13, '1', FALSE, 2),
  (13, '3', FALSE, 3),
  (13, '4', FALSE, 4),
  -- Ejercicio 14 (MEDIO · Arreglos)
  (14, '40', TRUE,  1),
  (14, '20', FALSE, 2),
  (14, '60', FALSE, 3),
  (14, '10', FALSE, 4),
  -- Ejercicio 15 (DIFÍCIL · Arreglos)
  (15, '4',  FALSE, 1),
  (15, '19', TRUE,  2),
  (15, '10', FALSE, 3),
  (15, '20', FALSE, 4);

-- ---------------------------------------------------------------------------
--  Logros del piloto
-- ---------------------------------------------------------------------------
INSERT INTO logros (codigo, nombre, descripcion, condicion, puntos) VALUES
  ('PRIMER_ACIERTO', 'Primer acierto',      'Resuelve correctamente tu primer ejercicio.',        '{"tipo":"aciertos_totales","valor":1}'::jsonb, 5),
  ('PRIMERA_SERIE',  'Primera serie',       'Resuelve 10 ejercicios correctamente.',              '{"tipo":"aciertos_totales","valor":10}'::jsonb, 20),
  ('RACHA_INICIAL',  'Racha inicial',       'Mantén una racha de 3 días consecutivos.',           '{"tipo":"racha_dias","valor":3}'::jsonb, 15),
  ('MAESTRO_LOGICA', 'Maestro de lógica',   'Acierta los 15 ejercicios del banco de Lógica.',     '{"tipo":"ejercicios_distintos_correctos","valor":15}'::jsonb, 50),
  ('PUNTOS_LOGICOS', 'Lógica en marcha', 'Acumula 100 puntos resolviendo ejercicios.', '{"tipo":"puntos_acumulados","valor":100}'::jsonb, 20),
  ('DESAFIO_DIFICIL', 'Desafío superado', 'Resuelve correctamente un ejercicio de nivel difícil.', '{"tipo":"dificultad_completada","nivel":"DIFICIL"}'::jsonb, 15),
  ('TEMA_DOMINADO', 'Tema dominado', 'Resuelve correctamente todos los ejercicios de al menos un tema.', '{"tipo":"tema_perfecto"}'::jsonb, 25),
  ('EXPLORADOR_DE_TEMAS', 'Explorador de lógica', 'Consigue al menos un acierto en cada uno de los cinco temas del piloto.', '{"tipo":"temas_explorados","valor":5}'::jsonb, 20),
  ('PRIMER_INTENTO', 'Código preciso', 'Acumula diez respuestas correctas al primer intento.', '{"tipo":"aciertos_primer_intento","valor":10}'::jsonb, 20),
  ('PERSEVERANTE', 'Depurador persistente', 'Registra treinta intentos resolviendo ejercicios.', '{"tipo":"intentos_totales","valor":30}'::jsonb, 15),
  ('DOMINIO_DIFICIL', 'Maestro de desafíos', 'Resuelve correctamente los cinco ejercicios difíciles del banco.', '{"tipo":"ejercicios_dificiles","valor":5}'::jsonb, 40),
  ('RACHA_SEMANAL', 'Lógica constante', 'Mantén una racha de actividad de siete días consecutivos.', '{"tipo":"racha_dias","valor":7}'::jsonb, 30);

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
--    SELECT count(*) FROM ejercicios;            -- 15
--    SELECT e.titulo, count(o.id) FROM ejercicios e JOIN opciones o ON o.ejercicio_id = e.id GROUP BY e.id ORDER BY e.id;
-- ============================================================================
