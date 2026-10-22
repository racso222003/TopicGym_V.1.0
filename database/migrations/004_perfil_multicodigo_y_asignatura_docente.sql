-- ============================================================================
-- Migración 004: Perfil ampliado, códigos multi-vínculo y filtrado por asignatura
-- ============================================================================
BEGIN;

-- 1) Ampliar perfil de usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
  ADD COLUMN IF NOT EXISTS direccion VARCHAR(150),
  ADD COLUMN IF NOT EXISTS ciudad VARCHAR(80);

-- 2) Asociar códigos de clase a una asignatura
ALTER TABLE codigos_clase
  ADD COLUMN IF NOT EXISTS asignatura_id INTEGER REFERENCES asignaturas(id);

-- Intentar asociar códigos existentes a Lógica de Programación (piloto)
UPDATE codigos_clase cc
SET asignatura_id = (SELECT id FROM asignaturas ORDER BY id ASC LIMIT 1)
WHERE cc.asignatura_id IS NULL;

-- 3) Permitir múltiples vínculos estudiante-código
ALTER TABLE estudiantes_docentes
  DROP CONSTRAINT IF EXISTS pk_estudiantes_docentes;

-- Crear clave compuesta si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pk_estudiantes_docentes_multi'
  ) THEN
    ALTER TABLE estudiantes_docentes
      ADD CONSTRAINT pk_estudiantes_docentes_multi PRIMARY KEY (estudiante_id, codigo_id);
  END IF;
END $$;

-- Índice para buscar por código
CREATE INDEX IF NOT EXISTS idx_estudiantes_docentes_codigo_id
  ON estudiantes_docentes (codigo_id);

CREATE INDEX IF NOT EXISTS idx_estudiantes_docentes_estudiante_id
  ON estudiantes_docentes (estudiante_id);

-- Índice para filtrar códigos por asignatura
CREATE INDEX IF NOT EXISTS idx_codigos_clase_asignatura_id
  ON codigos_clase (asignatura_id);

COMMIT;
