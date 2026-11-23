'use strict';

const { Router } = require('express');
const { authenticate, requirePermission } = require('../middlewares/auth');
const paymentController = require('../controllers/paymentController');

const router = Router();

router.use(authenticate, requirePermission('sales.read'));
router.get('/methods', paymentController.listMethods);

module.exports = router;
