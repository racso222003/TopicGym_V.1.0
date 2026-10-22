-- ============================================================================
-- TopicGym · Migración 005: ocho logros adicionales
-- Ejecutar desde la raíz del proyecto:
--   psql -U postgres -d topicgym -f database/migrations/005_nuevos_logros.sql
-- Idempotente: puede ejecutarse más de una vez.
-- ============================================================================

BEGIN;

-- Normaliza las condiciones de los cuatro logros iniciales para que el mismo
-- evaluador pueda procesar todos los registros mediante `condicion.tipo`.
UPDATE logros
   SET condicion = '{"tipo":"aciertos_totales","valor":1}'::jsonb
 WHERE codigo = 'PRIMER_ACIERTO';

UPDATE logros
   SET condicion = '{"tipo":"aciertos_totales","valor":10}'::jsonb
 WHERE codigo = 'PRIMERA_SERIE';

UPDATE logros
   SET condicion = '{"tipo":"racha_dias","valor":3}'::jsonb
 WHERE codigo = 'RACHA_INICIAL';

UPDATE logros
   SET condicion = '{"tipo":"ejercicios_distintos_correctos","valor":15}'::jsonb
 WHERE codigo = 'MAESTRO_LOGICA';

INSERT INTO logros (codigo, nombre, descripcion, condicion, puntos) VALUES
  (
    'PUNTOS_LOGICOS',
    'Lógica en marcha',
    'Acumula 100 puntos resolviendo ejercicios.',
    '{"tipo":"puntos_acumulados","valor":100}'::jsonb,
    20
  ),
  (
    'DESAFIO_DIFICIL',
    'Desafío superado',
    'Resuelve correctamente un ejercicio de nivel difícil.',
    '{"tipo":"dificultad_completada","nivel":"DIFICIL"}'::jsonb,
    15
  ),
  (
    'TEMA_DOMINADO',
    'Tema dominado',
    'Resuelve correctamente todos los ejercicios de al menos un tema.',
    '{"tipo":"tema_perfecto"}'::jsonb,
    25
  ),
  (
    'EXPLORADOR_DE_TEMAS',
    'Explorador de lógica',
    'Consigue al menos un acierto en cada uno de los cinco temas del piloto.',
    '{"tipo":"temas_explorados","valor":5}'::jsonb,
    20
  ),
  (
    'PRIMER_INTENTO',
    'Código preciso',
    'Acumula diez respuestas correctas al primer intento.',
    '{"tipo":"aciertos_primer_intento","valor":10}'::jsonb,
    20
  ),
  (
    'PERSEVERANTE',
    'Depurador persistente',
    'Registra treinta intentos resolviendo ejercicios.',
    '{"tipo":"intentos_totales","valor":30}'::jsonb,
    15
  ),
  (
    'DOMINIO_DIFICIL',
    'Maestro de desafíos',
    'Resuelve correctamente los cinco ejercicios difíciles del banco.',
    '{"tipo":"ejercicios_dificiles","valor":5}'::jsonb,
    40
  ),
  (
    'RACHA_SEMANAL',
    'Lógica constante',
    'Mantén una racha de actividad de siete días consecutivos.',
    '{"tipo":"racha_dias","valor":7}'::jsonb,
    30
  )
ON CONFLICT (codigo) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      descripcion = EXCLUDED.descripcion,
      condicion = EXCLUDED.condicion,
      puntos = EXCLUDED.puntos;

COMMIT;
