'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const authController = require('../controllers/authController');

const router = Router();

router.use(authenticate);
router.get('/me', authController.me);
router.get('/permissions', authController.permissions);

module.exports = router;
