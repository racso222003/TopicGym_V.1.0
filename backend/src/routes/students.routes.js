'use strict';

const { Router } = require('express');
const authCtrl = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.use(requireAuth);
router.get('/mis-codigos', authCtrl.listarMisCodigos);
router.post('/link-code', authCtrl.vincularCodigo);
router.patch('/me', authCtrl.updateMe);
router.put('/me', authCtrl.updateMe);

module.exports = router;
