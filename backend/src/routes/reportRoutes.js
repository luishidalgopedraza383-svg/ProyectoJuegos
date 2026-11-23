'use strict';

const { Router } = require('express');
const { authenticate, requirePermission } = require('../middlewares/auth');
const reportController = require('../controllers/reportController');

const router = Router();

router.use(authenticate, requirePermission('reports.read'));

router.get('/summary', reportController.summary);
router.get('/top-games', reportController.topGames);
router.get('/sales-by-day', reportController.salesByDay);

module.exports = router;
