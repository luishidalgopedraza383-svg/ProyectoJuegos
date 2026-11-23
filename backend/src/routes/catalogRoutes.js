'use strict';

const { Router } = require('express');
const { authenticate, requirePermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createGameSchema, updateGameSchema } = require('../validators/schemas');
const catalogController = require('../controllers/catalogController');

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('catalog.read'), catalogController.list);
router.get('/:id', requirePermission('catalog.read'), validate(updateGameSchema.pick({ params: true })), catalogController.get);
router.post('/', requirePermission('catalog.write'), validate(createGameSchema), catalogController.create);
router.patch('/:id', requirePermission('catalog.write'), validate(updateGameSchema), catalogController.update);

module.exports = router;
