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
const JSON_BANCO = path.join(RAIZ, 'banco-ejercicios', 'ejercicios_piloto.json');

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
      `INSERT INTO usuarios (rol_id, nombre, correo_institucional, password_hash)
       VALUES ((SELECT id FROM roles WHERE codigo = $1), $2, $3, $4)
       ON CONFLICT (correo_institucional) DO UPDATE
         SET nombre = EXCLUDED.nombre,
             password_hash = EXCLUDED.password_hash,
             rol_id = EXCLUDED.rol_id
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
