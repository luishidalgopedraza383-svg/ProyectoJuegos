'use strict';

const { Router } = require('express');
const { authenticate, requirePermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { movementSchema, updateItemSchema } = require('../validators/schemas');
const inventoryController = require('../controllers/inventoryController');

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('inventory.read'), inventoryController.list);
router.get('/low-stock', requirePermission('inventory.read'), inventoryController.lowStock);
router.get('/movements', requirePermission('inventory.read'), inventoryController.movements);
router.post('/:itemId/movements', requirePermission('inventory.write'), validate(movementSchema), inventoryController.registerMovement);
router.patch('/:itemId', requirePermission('inventory.write'), validate(updateItemSchema), inventoryController.updateItem);

module.exports = router;
