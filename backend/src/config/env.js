'use strict';

// Lectura centralizada de variables de entorno.
// No importar process.env directamente en otros módulos: usar este archivo.

require('dotenv').config();

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: toInt(process.env.DB_PORT, 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'topicgym',
    max: toInt(process.env.DB_POOL_MAX, 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'secreto-de-desarrollo-no-usar-en-produccion',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:4200,http://127.0.0.1:4200,http://localhost:5500,http://127.0.0.1:5500')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },

  rateLimit: {
    apiMax: toInt(process.env.API_RATE_MAX, 300),
    apiWindowMs: toInt(process.env.API_RATE_WINDOW_MS, 600000),
    authMax: toInt(process.env.AUTH_RATE_MAX, 10),
    authWindowMs: toInt(process.env.AUTH_RATE_WINDOW_MS, 600000),
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
  },
};

module.exports = config;
