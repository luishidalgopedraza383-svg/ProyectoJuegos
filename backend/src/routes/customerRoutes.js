'use strict';

const { Router } = require('express');
const { authenticate, requirePermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { customerSchema } = require('../validators/schemas');
const customerController = require('../controllers/customerController');

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('customers.read'), customerController.list);
router.get('/:id', requirePermission('customers.read'), customerController.get);
router.post('/', requirePermission('customers.write'), validate(customerSchema), customerController.create);

module.exports = router;
