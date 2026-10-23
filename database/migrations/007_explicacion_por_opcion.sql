-- TopicGym · Migración 007: retroalimentación individual de opciones
-- No elimina ni modifica las opciones o respuestas existentes.
BEGIN;

ALTER TABLE opciones
  ADD COLUMN IF NOT EXISTS explicacion TEXT;

COMMIT;
