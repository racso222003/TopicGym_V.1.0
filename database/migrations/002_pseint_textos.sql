-- ============================================================================
--  TopicGym v1.0 · Migración 002
--  Estandarización a PSeInt de enunciados / explicaciones / pistas
-- ----------------------------------------------------------------------------
--  NO destructiva: solo actualiza texto de la tabla `ejercicios`.
--  Conserva respuestas, progreso y logros de los estudiantes.
--
--  Aplicar (desde la raíz del proyecto):
--    psql -U postgres -d topicgym -f database/migrations/002_pseint_textos.sql
--
--  Idempotente. Complementa a la migración 001 (que normaliza codigo_referencia).
-- ============================================================================

BEGIN;

-- 1) enunciado: mostrar(...) -> Escribir
UPDATE ejercicios
   SET enunciado = 'Si la variable entera edad es 17, ¿qué se muestra al ejecutar Escribir edad + 1?'
 WHERE orden = 1;

-- 2) enunciado: mostrar(entero(...)) -> Escribir Trunc(...)
UPDATE ejercicios
   SET enunciado = 'Si precio es 19.99, ¿qué muestra al ejecutar Escribir Trunc(precio)?'
 WHERE orden = 2;

-- 5) explicacion: (%) -> (mod)
UPDATE ejercicios
   SET explicacion = 'El módulo (mod) devuelve el residuo de la división entera: 15 ÷ 4 = 3 con residuo 3, por lo que resto = 3.'
 WHERE orden = 5;

-- 6) explicacion: operador % -> mod ; pista: % -> mod
UPDATE ejercicios
   SET explicacion = 'Módulo, multiplicación y división se evalúan antes de la suma: 10 mod 3 = 1; 1 * 2 = 2; 8 / 4 = 2. Luego 2 + 2 = 4.',
       pista       = 'Agrupa primero mod, * y /.'
 WHERE orden = 6;

-- 9) pista: operador && -> Y
UPDATE ejercicios
   SET pista = 'Evalúa cada parte del Y (todas deben ser verdaderas).'
 WHERE orden = 9;

-- 13) pista: n % 2 == 0 -> n mod 2 = 0
UPDATE ejercicios
   SET pista = 'Un número es par si n mod 2 = 0.'
 WHERE orden = 13;

COMMIT;
