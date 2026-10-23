'use strict';

// ============================================================================
//  TopicGym v1.0 · backend/seed.js
//  Carga/verifica los datos piloto y crea usuarios demo con hash bcrypt.
// ----------------------------------------------------------------------------
//  Uso (desde la carpeta backend/):
//    npm run seed              -> crea esquema+datos si hace falta, usuarios y verifica
//    node seed.js --reset      -> re-aplica database/schema.sql + database/seed.sql
//    node seed.js --solo-usuarios
// ============================================================================

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');
const config = require('./src/config/env');

const RAIZ = path.join(__dirname, '..');
const SQL_SCHEMA = path.join(RAIZ, 'database', 'schema.sql');
const SQL_SEED = path.join(RAIZ, 'database', 'seed.sql');
const SQL_NUEVOS_LOGROS = path.join(RAIZ, 'database', 'migrations', '005_nuevos_logros.sql');
const SQL_CATALOGO_SEMESTRES = path.join(RAIZ, 'database', 'migrations', '006_catalogo_semestres_1_4.sql');
const SQL_EXPLICACION_OPCIONES = path.join(RAIZ, 'database', 'migrations', '007_explicacion_por_opcion.sql');
const JSON_BANCO = path.join(RAIZ, 'banco-ejercicios', 'ejercicios_piloto.json');
const JSON_EJERCICIOS_ASIGNATURAS = path.join(
  RAIZ,
  'banco-ejercicios',
  'ejercicios_asignaturas_nuevas.json',
);
const JSON_AMPLIACION_SEMESTRE_1 = path.join(
  RAIZ,
  'banco-ejercicios',
  'ejercicios_semestre_1_ampliacion.json',
);

const PUNTOS_POR_NIVEL = { FACIL: 10, MEDIO: 25, DIFICIL: 50 };
const ORDEN_POR_NIVEL = { FACIL: 1, MEDIO: 2, DIFICIL: 3 };

const USUARIOS_DEMO = [
  {
    nombre: 'Estudiante Demo',
    correo: 'estudiante.demo@institucion.edu.co',
    password: 'TopicGym2026',
    rol: 'ESTUDIANTE',
  },
  {
    nombre: 'Docente Demo',
    correo: 'docente.demo@institucion.edu.co',
    password: 'TopicGym2026',
    rol: 'DOCENTE',
  },
];

const args = process.argv.slice(2);
const RESET = args.includes('--reset');
const SOLO_USUARIOS = args.includes('--solo-usuarios');

async function aplicarSql(archivo) {
  const sql = fs.readFileSync(archivo, 'utf8');
  await pool.query(sql);
}

async function hayEsquema() {
  const { rows } = await pool.query(`SELECT to_regclass('public.ejercicios') AS t`);
  return rows[0].t !== null;
}

async function crearUsuarios() {
  const { rows: roles } = await pool.query(`SELECT id, codigo FROM roles`);
  if (roles.length === 0) {
    console.warn('[seed] No hay roles en la base de datos. Ejecuta primero el seed SQL.');
    return [];
  }
  const creados = [];
  for (const u of USUARIOS_DEMO) {
    const hash = await bcrypt.hash(u.password, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (rol_id, nombre, correo_institucional, password_hash, email_verificado)
       VALUES ((SELECT id FROM roles WHERE codigo = $1), $2, $3, $4, TRUE)
       ON CONFLICT (correo_institucional) DO UPDATE
         SET nombre = EXCLUDED.nombre,
             password_hash = EXCLUDED.password_hash,
             rol_id = EXCLUDED.rol_id,
             email_verificado = TRUE
       RETURNING correo_institucional`,
      [u.rol, u.nombre, u.correo, hash],
    );
    creados.push({ correo: rows[0].correo_institucional, rol: u.rol, password: u.password });
  }
  return creados;
}

async function verificarBanco() {
  const banco = JSON.parse(fs.readFileSync(JSON_BANCO, 'utf8'));
  const { rows } = await pool.query(
    `SELECT e.orden, e.nivel, e.puntos_ponderados, e.titulo,
            (SELECT o.texto FROM opciones o
              WHERE o.ejercicio_id = e.id AND o.es_correcta LIMIT 1) AS correcta
       FROM ejercicios e
       JOIN temas t ON t.id = e.tema_id
      WHERE t.asignatura_id = 1
      ORDER BY e.orden`,
  );

  const esperados = banco.ejercicios;
  const avisos = [];

  if (rows.length !== esperados.length) {
    avisos.push(
      `Cantidad de ejercicios: BD=${rows.length}, JSON=${esperados.length} (¿ejecutar seed.sql?)`,
    );
  }

  esperados.forEach((esperado, i) => {
    const real = rows[i];
    if (!real) {
      avisos.push(`Ejercicio orden ${esperado.orden} ausente en la BD.`);
      return;
    }
    const correctaJson = esperado.opciones.find((o) => o.es_correcta);
    if (real.nivel !== esperado.nivel) {
      avisos.push(`Ejercicio ${esperado.orden}: nivel BD=${real.nivel} JSON=${esperado.nivel}`);
    }
    if (real.puntos_ponderados !== esperado.puntos) {
      avisos.push(
        `Ejercicio ${esperado.orden}: puntos BD=${real.puntos_ponderados} JSON=${esperado.puntos}`,
      );
    }
    if (correctaJson && real.correcta !== correctaJson.texto) {
      avisos.push(
        `Ejercicio ${esperado.orden}: respuesta correcta BD="${real.correcta}" JSON="${correctaJson.texto}"`,
      );
    }
  });

  return { total: rows.length, avisos };
}

function validarEjercicioAsignatura(ejercicio, indice) {
  const niveles = Object.keys(PUNTOS_POR_NIVEL);
  if (!ejercicio.asignatura || !ejercicio.tema || !ejercicio.enunciado) {
    throw new Error(`Ejercicio ${indice + 1}: faltan asignatura, tema o enunciado.`);
  }
  if (ejercicio.tipo !== 'OPCION_MULTIPLE' || !niveles.includes(ejercicio.dificultad)) {
    throw new Error(`Ejercicio ${indice + 1}: tipo o dificultad inválidos.`);
  }
  if (
    !Array.isArray(ejercicio.opciones) ||
    ejercicio.opciones.length !== 4 ||
    ejercicio.opciones.filter((opcion) => opcion.es_correcta === true).length !== 1 ||
    ejercicio.opciones.some(
      (opcion) =>
        typeof opcion.texto !== 'string' ||
        !opcion.texto.trim() ||
        typeof opcion.explicacion !== 'string' ||
        !opcion.explicacion.trim(),
    )
  ) {
    throw new Error(`Ejercicio ${indice + 1}: requiere cuatro opciones y exactamente una correcta.`);
  }
}

/** Importa el contenido por asignatura de forma idempotente y conserva IDs de opciones existentes. */
async function cargarEjerciciosAsignaturas() {
  const ejerciciosBase = JSON.parse(fs.readFileSync(JSON_EJERCICIOS_ASIGNATURAS, 'utf8'));
  const ampliacionSemestre1 = JSON.parse(fs.readFileSync(JSON_AMPLIACION_SEMESTRE_1, 'utf8'));
  const ejercicios = [...ejerciciosBase, ...ampliacionSemestre1];
  if (ejerciciosBase.length !== 65 || ampliacionSemestre1.length !== 60 || ejercicios.length !== 125) {
    throw new Error('Los bancos de asignaturas deben contener 65 ejercicios base y 60 de ampliación.');
  }
  ejercicios.forEach(validarEjercicioAsignatura);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const ejercicio of ejercicios) {
      const { rows: asignaturas } = await client.query(
        'SELECT id FROM asignaturas WHERE nombre = $1',
        [ejercicio.asignatura],
      );
      if (asignaturas.length !== 1) {
        throw new Error(`La asignatura "${ejercicio.asignatura}" debe existir una sola vez.`);
      }
      const asignaturaId = asignaturas[0].id;

      let temas = (
        await client.query(
          'SELECT id FROM temas WHERE asignatura_id = $1 AND titulo = $2 ORDER BY id LIMIT 1',
          [asignaturaId, ejercicio.tema],
        )
      ).rows;
      if (temas.length === 0) {
        const { rows: ordenRows } = await client.query(
          'SELECT COALESCE(MAX(orden), 0) + 1 AS orden FROM temas WHERE asignatura_id = $1',
          [asignaturaId],
        );
        const dificultadBase = ejercicio.dificultad === 'FACIL' ? 'BASICO' : 'INTERMEDIO';
        const { rows } = await client.query(
          `INSERT INTO temas (asignatura_id, titulo, descripcion, dificultad_base, orden)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            asignaturaId,
            ejercicio.tema,
            `Conceptos y práctica de ${ejercicio.tema}.`,
            dificultadBase,
            ordenRows[0].orden,
          ],
        );
        temas = rows;
      }
      const temaId = temas[0].id;
      const titulo = ejercicio.titulo || ejercicio.tema;
      const explicacion = ejercicio.opciones.find((opcion) => opcion.es_correcta).explicacion;
      const puntos = PUNTOS_POR_NIVEL[ejercicio.dificultad];
      const orden = ORDEN_POR_NIVEL[ejercicio.dificultad];

      let { rows: ejerciciosExistentes } = await client.query(
        'SELECT id FROM ejercicios WHERE tema_id = $1 AND titulo = $2 ORDER BY id LIMIT 1',
        [temaId, titulo],
      );
      let ejercicioId;
      if (ejerciciosExistentes.length === 0) {
        const { rows } = await client.query(
          `INSERT INTO ejercicios
             (tema_id, nivel, tipo, titulo, enunciado, codigo_referencia, explicacion, pista, puntos_ponderados, orden)
           VALUES ($1, $2, $3, $4, $5, NULL, $6, NULL, $7, $8)
           RETURNING id`,
          [temaId, ejercicio.dificultad, ejercicio.tipo, titulo, ejercicio.enunciado, explicacion, puntos, orden],
        );
        ejercicioId = rows[0].id;
      } else {
        ejercicioId = ejerciciosExistentes[0].id;
        await client.query(
          `UPDATE ejercicios
              SET nivel = $2, tipo = $3, titulo = $4, enunciado = $5, explicacion = $6,
                  puntos_ponderados = $7, orden = $8
            WHERE id = $1`,
          [ejercicioId, ejercicio.dificultad, ejercicio.tipo, titulo, ejercicio.enunciado, explicacion, puntos, orden],
        );
      }

      const { rows: opcionesExistentes } = await client.query(
        'SELECT id, orden FROM opciones WHERE ejercicio_id = $1',
        [ejercicioId],
      );
      if (opcionesExistentes.some((opcion) => opcion.orden < 1 || opcion.orden > 4)) {
        throw new Error(`El ejercicio "${titulo}" contiene opciones adicionales fuera del banco administrado.`);
      }

      // Quita primero la marca correcta para respetar uq_opcion_correcta durante el upsert.
      await client.query('UPDATE opciones SET es_correcta = FALSE WHERE ejercicio_id = $1', [ejercicioId]);
      for (const [indice, opcion] of ejercicio.opciones.entries()) {
        const orden = indice + 1;
        const existente = opcionesExistentes.find((fila) => fila.orden === orden);
        if (existente) {
          await client.query(
            `UPDATE opciones
                SET texto = $2, explicacion = $3, es_correcta = $4
              WHERE id = $1`,
            [existente.id, opcion.texto, opcion.explicacion, opcion.es_correcta],
          );
        } else {
          await client.query(
            `INSERT INTO opciones (ejercicio_id, texto, explicacion, es_correcta, orden)
             VALUES ($1, $2, $3, $4, $5)`,
            [ejercicioId, opcion.texto, opcion.explicacion, opcion.es_correcta, orden],
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log(`[seed] Banco de asignaturas cargado/verificado: ${ejercicios.length} ejercicios.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('[seed] TopicGym v1.0 · datos piloto');
  console.log(
    `[seed] Entorno: ${config.nodeEnv} · BD: ${config.db.database}@${config.db.host}:${config.db.port}`,
  );

  if (!SOLO_USUARIOS) {
    if (!(await hayEsquema())) {
      console.log('[seed] Tablas no encontradas: aplicando database/schema.sql …');
      await aplicarSql(SQL_SCHEMA);
      console.log('[seed] Aplicando database/seed.sql …');
      await aplicarSql(SQL_SEED);
    } else if (RESET) {
      console.log('[seed] --reset: re-aplicando database/schema.sql + database/seed.sql …');
      await aplicarSql(SQL_SCHEMA);
      await aplicarSql(SQL_SEED);
    }

    // Mantiene disponibles los logros nuevos también en bases ya inicializadas.
    await aplicarSql(SQL_NUEVOS_LOGROS);
    // Expande el catálogo sin modificar el contenido del piloto de Lógica.
    await aplicarSql(SQL_CATALOGO_SEMESTRES);
    await aplicarSql(SQL_EXPLICACION_OPCIONES);
    await cargarEjerciciosAsignaturas();
  }

  const usuarios = await crearUsuarios();
  console.log('[seed] Usuarios demo listos:');
  usuarios.forEach((u) => console.log(`        · ${u.correo}  (${u.rol})  contraseña: ${u.password}`));

  if (SOLO_USUARIOS) return;

  const { total, avisos } = await verificarBanco();
  console.log(`[seed] Banco de ejercicios verificado: ${total} ejercicios.`);
  if (avisos.length) {
    console.warn('[seed] Avisos:');
    avisos.forEach((a) => console.warn(`        ! ${a}`));
  } else {
    console.log('[seed] Banco OK: coincide con banco-ejercicios/ejercicios_piloto.json');
  }

  console.log('[seed] Listo. Inicia la API con: npm run dev');
}

main()
  .catch((err) => {
    console.error('[seed] Error:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
