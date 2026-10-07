'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();

// Cabeceras de seguridad HTTP
app.use(helmet());

// CORS restringido a los orígenes de la SPA (Compromiso 04 · Acta 06)
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// Límite global de peticiones a la API (Compromiso 04 · Acta 06).
// /auth/login mantiene su propio límite, más estricto (ver auth.routes.js).
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.apiWindowMs,
  limit: config.rateLimit.apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo más tarde.' },
});

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
if (config.nodeEnv !== 'test') app.use(morgan('dev'));

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
