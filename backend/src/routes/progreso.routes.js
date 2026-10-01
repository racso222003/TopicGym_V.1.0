'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/ejercicios.controller');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.get('/progress', requireAuth, ctrl.progreso);
router.get('/achievements', requireAuth, ctrl.logros);
router.get('/stats', requireAuth, ctrl.stats);

module.exports = router;
