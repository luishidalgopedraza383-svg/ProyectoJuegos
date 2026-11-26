'use strict';

const { Router } = require('express');
const { authenticate, requirePermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createWalletSchema, depositSchema } = require('../validators/schemas');
const walletController = require('../controllers/walletController');

const router = Router();

// Cualquier usuario autenticado puede crear billeteras y recargar la suya.
router.use(authenticate);
router.get('/me', walletController.mine);
router.post('/', validate(createWalletSchema), walletController.create);
router.post('/:id/deposit', validate(depositSchema), walletController.deposit);

// Solo el personal del panel ve todas (un comprador no tiene customers.read).
router.get('/all', requirePermission('customers.read'), walletController.all);

module.exports = router;
