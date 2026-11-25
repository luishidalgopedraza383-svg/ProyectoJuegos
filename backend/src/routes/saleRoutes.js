'use strict';

const { Router } = require('express');
const { authenticate, requirePermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createSaleSchema, cancelSaleSchema, returnSchema, shiftSchema } = require('../validators/schemas');
const saleController = require('../controllers/saleController');

const router = Router();

router.use(authenticate);

// Turno de caja
router.get('/shifts/me', requirePermission('sales.read'), saleController.myShift);
router.post('/shifts/open', requirePermission('sales.write'), validate(shiftSchema), saleController.openShift);
router.post('/shifts/close', requirePermission('sales.write'), validate(shiftSchema), saleController.closeShift);

// Ventas
router.get('/', requirePermission('sales.read'), saleController.list);
router.get('/:id', requirePermission('sales.read'), saleController.get);
router.post('/', requirePermission('sales.write'), validate(createSaleSchema), saleController.create);
// Anular/devolver requiere además sales.cancel (no lo tiene el comprador).
router.post('/:id/cancel', requirePermission('sales.write', 'sales.cancel'), validate(cancelSaleSchema), saleController.cancel);
router.post('/:id/returns', requirePermission('sales.write', 'sales.cancel'), validate(returnSchema), saleController.makeReturn);

module.exports = router;
