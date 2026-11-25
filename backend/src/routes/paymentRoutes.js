'use strict';

const { Router } = require('express');
const { authenticate, requirePermission } = require('../middlewares/auth');
const paymentController = require('../controllers/paymentController');

const router = Router();

router.use(authenticate, requirePermission('sales.read'));
router.get('/methods', paymentController.listMethods);
router.get('/cards/me', paymentController.myCard);
// El personal del POS elige la tarjeta del comprador que está atendiendo.
router.get('/cards', requirePermission('sales.write'), paymentController.buyerCards);

// Cuentas bancarias para Transferencia: el comprador ve solo la suya y el
// personal del POS elige la del comprador que está atendiendo.
router.get('/accounts/me', paymentController.myBankAccount);
router.get('/accounts', requirePermission('sales.write'), paymentController.buyerBankAccounts);

module.exports = router;
