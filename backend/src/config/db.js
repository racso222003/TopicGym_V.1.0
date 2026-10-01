'use strict';

// Pool de conexiones a PostgreSQL (sin ORM: SQL parametrizado).

const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: config.db.max,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[pg] Error inesperado en el pool:', err.message);
});

/** Ejecuta una consulta parametrizada. */
function query(text, params) {
  return pool.query(text, params);
}

/** Ejecuta varias consultas dentro de una transacción. */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function healthcheck() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}

module.exports = { pool, query, withTransaction, healthcheck };
