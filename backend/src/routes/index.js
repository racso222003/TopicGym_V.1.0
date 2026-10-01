'use strict';

const { Router } = require('express');
const { healthcheck } = require('../config/db');
const authRoutes = require('./auth.routes');
const catalogoRoutes = require('./catalogo.routes');
const ejerciciosRoutes = require('./ejercicios.routes');
const progresoRoutes = require('./progreso.routes');

const router = Router();

router.get('/health', async (_req, res, next) => {
  try {
    const db = await healthcheck();
    res.json({ status: 'ok', db, uptime: process.uptime() });
  } catch (err) {
    next(err);
  }
});

router.use('/auth', authRoutes);
router.use('/', catalogoRoutes);
router.use('/exercises', ejerciciosRoutes);
router.use('/', progresoRoutes);

module.exports = router;
