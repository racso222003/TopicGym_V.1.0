-- ============================================================================
-- Migración 003: Autenticación con verificación de correo + Módulo Docentes
-- TopicGym v1.0
-- ============================================================================
-- Alcance:
--   - Añadir campos para verificación de correo a usuarios
--   - Crear tabla para códigos de clase (generados por docentes)
--   - Crear tabla para vinculación estudiante - código de clase
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Ajustes a la tabla usuarios
-- ---------------------------------------------------------------------------
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(255);

-- Índice para buscar por token de verificación de forma ágil
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion
  ON usuarios (token_verificacion);

-- ---------------------------------------------------------------------------
-- 2) Tabla: códigos de clase generados por docentes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codigos_clase (
  id              SERIAL        PRIMARY KEY,
  docente_id      UUID          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo          VARCHAR(20)   NOT NULL UNIQUE,
  activo          BOOLEAN       NOT NULL DEFAULT TRUE,
  fecha_creacion  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_codigos_clase_docente_id
  ON codigos_clase (docente_id);

CREATE INDEX IF NOT EXISTS idx_codigos_clase_codigo_activo
  ON codigos_clase (codigo)
  WHERE activo = TRUE;

-- ---------------------------------------------------------------------------
-- 3) Tabla: vinculación entre estudiantes y códigos de clase
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estudiantes_docentes (
  estudiante_id     UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo_id         INTEGER     NOT NULL REFERENCES codigos_clase(id) ON DELETE RESTRICT,
  fecha_vinculacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_estudiantes_docentes PRIMARY KEY (estudiante_id)
);

-- Índice para obtener todos los estudiantes de un código/docente
CREATE INDEX IF NOT EXISTS idx_estudiantes_docentes_codigo_id
  ON estudiantes_docentes (codigo_id);

COMMIT;
