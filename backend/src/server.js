'use strict';

const app = require('./app');
const config = require('./config/env');
const { pool } = require('./config/db');

const server = app.listen(config.port, () => {
  console.log(`[server] TopicGym API escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`\n[server] ${signal} recibido. Cerrando...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
