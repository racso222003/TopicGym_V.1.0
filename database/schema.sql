-- ============================================================================
--  TopicGym v1.0  ·  Compromiso 02 (Acta 02)
--  Base de datos inicial · PostgreSQL 16+ (compatible con PostgreSQL 18)
--  Alcance: piloto de Lógica de Programación (1.º semestre) — usuarios + ejercicios
-- ----------------------------------------------------------------------------
--  Uso:
--    1) createdb topicgym        (o)  psql -U postgres -c "CREATE DATABASE topicgym;"
--    2) psql -U postgres -d topicgym -f database/schema.sql
--    3) psql -U postgres -d topicgym -f database/seed.sql
-- ============================================================================

-- CREATE DATABASE topicgym;   -- ejecutar por separado, fuera de transacción

BEGIN;

-- ---------------------------------------------------------------------------
--  Limpieza (permite re-ejecutar el script desde cero)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS logros_obtenidos      CASCADE;
DROP TABLE IF EXISTS logros                CASCADE;
DROP TABLE IF EXISTS progreso_estudiante   CASCADE;
DROP TABLE IF EXISTS respuestas_estudiante CASCADE;
DROP TABLE IF EXISTS opciones              CASCADE;
DROP TABLE IF EXISTS ejercicios            CASCADE;
DROP TABLE IF EXISTS videos                CASCADE;
DROP TABLE IF EXISTS temas                 CASCADE;
DROP TABLE IF EXISTS asignaturas           CASCADE;
DROP TABLE IF EXISTS semestres             CASCADE;
DROP TABLE IF EXISTS usuarios              CASCADE;
DROP TABLE IF EXISTS roles                 CASCADE;

-- ---------------------------------------------------------------------------
--  1) Acceso y usuarios  (núcleo solicitado en el acta)
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
    id           SERIAL       PRIMARY KEY,
    codigo       VARCHAR(20)  NOT NULL UNIQUE,          -- ESTUDIANTE | DOCENTE | ADMIN
    nombre       VARCHAR(60)  NOT NULL,
    descripcion  TEXT
);

CREATE TABLE usuarios (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id                INTEGER       NOT NULL REFERENCES roles(id),
    nombre                VARCHAR(100)  NOT NULL,
    correo_institucional  VARCHAR(120)  NOT NULL UNIQUE,
    password_hash         VARCHAR(255),                 -- bcrypt; nullable si usa SSO
    activo                BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en             TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_usuarios_correo ON usuarios (correo_institucional);

-- ---------------------------------------------------------------------------
--  2) Alineación curricular
-- ---------------------------------------------------------------------------
CREATE TABLE semestres (
    id      SERIAL      PRIMARY KEY,
    numero  SMALLINT    NOT NULL UNIQUE CHECK (numero BETWEEN 1 AND 4),
    nombre  VARCHAR(80) NOT NULL,
    estado  VARCHAR(14) NOT NULL DEFAULT 'PROXIMAMENTE'
            CHECK (estado IN ('ACTIVO', 'PROXIMAMENTE'))
);

CREATE TABLE asignaturas (
    id           SERIAL      PRIMARY KEY,
    semestre_id  INTEGER     NOT NULL REFERENCES semestres(id) ON DELETE CASCADE,
    nombre       VARCHAR(80) NOT NULL,
    orden        SMALLINT    NOT NULL DEFAULT 1
);

CREATE TABLE temas (
    id               SERIAL      PRIMARY KEY,
    asignatura_id    INTEGER     NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
    titulo           VARCHAR(120) NOT NULL,
    descripcion      TEXT,
    dificultad_base  VARCHAR(12)  NOT NULL DEFAULT 'BASICO'
                     CHECK (dificultad_base IN ('BASICO', 'INTERMEDIO')),
    orden            SMALLINT    NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
--  3) Contenido: teoría (videos) y banco de ejercicios
-- ---------------------------------------------------------------------------
CREATE TABLE videos (
    id           SERIAL       PRIMARY KEY,
    tema_id      INTEGER      NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    titulo       VARCHAR(140) NOT NULL,
    url_youtube  VARCHAR(255) NOT NULL,                 -- URL de referencia / búsqueda
    duracion_seg INTEGER,
    orden        SMALLINT     NOT NULL DEFAULT 1
);

CREATE TABLE ejercicios (
    id                  SERIAL       PRIMARY KEY,
    tema_id             INTEGER      NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    nivel               VARCHAR(8)   NOT NULL CHECK (nivel IN ('FACIL', 'MEDIO', 'DIFICIL')),
    tipo                VARCHAR(16)  NOT NULL CHECK (tipo IN ('OPCION_MULTIPLE', 'PSEUDOCODIGO')),
    titulo              VARCHAR(140) NOT NULL,
    enunciado           TEXT         NOT NULL,
    codigo_referencia   TEXT,                            -- pseudocódigo / fragmento mostrado
    explicacion         TEXT         NOT NULL,           -- explicación en texto (compromiso 03)
    pista               VARCHAR(255),
    puntos_ponderados   INTEGER      NOT NULL DEFAULT 10,
    orden               SMALLINT     NOT NULL DEFAULT 1
);
CREATE INDEX idx_ejercicios_tema_nivel ON ejercicios (tema_id, nivel);

CREATE TABLE opciones (
    id            SERIAL    PRIMARY KEY,
    ejercicio_id  INTEGER   NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    texto         TEXT      NOT NULL,
    es_correcta   BOOLEAN   NOT NULL DEFAULT FALSE,
    orden         SMALLINT  NOT NULL DEFAULT 1,
    CONSTRAINT uq_opcion_orden UNIQUE (ejercicio_id, orden)
);
-- Solo una opción correcta por ejercicio (índice parcial)
CREATE UNIQUE INDEX uq_opcion_correcta ON opciones (ejercicio_id) WHERE es_correcta;

-- ---------------------------------------------------------------------------
--  4) Trazabilidad del estudiante (mínima para el piloto)
-- ---------------------------------------------------------------------------
CREATE TABLE respuestas_estudiante (
    id             BIGSERIAL    PRIMARY KEY,
    usuario_id     UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ejercicio_id   INTEGER      NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    opcion_id      INTEGER      REFERENCES opciones(id),
    texto_respuesta TEXT,                               -- para tipo PSEUDOCODIGO
    correcta       BOOLEAN      NOT NULL,
    intento        SMALLINT     NOT NULL DEFAULT 1,
    respondido_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_respuestas_usuario_fecha ON respuestas_estudiante (usuario_id, respondido_en);

CREATE TABLE progreso_estudiante (
    id                   BIGSERIAL   PRIMARY KEY,
    usuario_id           UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tema_id              INTEGER     NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    ejercicios_resueltos INTEGER     NOT NULL DEFAULT 0,
    puntos               INTEGER     NOT NULL DEFAULT 0,
    actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_progreso UNIQUE (usuario_id, tema_id)
);

-- ---------------------------------------------------------------------------
--  5) Gamificación
-- ---------------------------------------------------------------------------
CREATE TABLE logros (
    id           SERIAL       PRIMARY KEY,
    codigo       VARCHAR(30)  NOT NULL UNIQUE,
    nombre       VARCHAR(80)  NOT NULL,
    descripcion  TEXT         NOT NULL,
    condicion    JSONB        NOT NULL,                 -- umbral para otorgarlo
    puntos       INTEGER      NOT NULL DEFAULT 0
);

CREATE TABLE logros_obtenidos (
    id          BIGSERIAL   PRIMARY KEY,
    usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    logro_id    INTEGER     NOT NULL REFERENCES logros(id) ON DELETE CASCADE,
    obtenido_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_logro_usuario UNIQUE (usuario_id, logro_id)
);

-- ---------------------------------------------------------------------------
--  Vista de apoyo: banco piloto listo para consumir desde la API
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_ejercicios_piloto AS
SELECT e.id, e.tema_id, e.nivel, e.tipo, e.titulo, e.enunciado,
       e.codigo_referencia, e.explicacion, e.pista, e.puntos_ponderados, e.orden
FROM ejercicios e
ORDER BY e.tema_id, e.orden;

COMMIT;

-- ============================================================================
--  Fin del esquema. Ejecutar database/seed.sql para cargar los datos piloto.
-- ============================================================================
