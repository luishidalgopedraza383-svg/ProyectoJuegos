'use strict';

const { Router } = require('express');
const { apiPrefix } = require('../config/env');

const authRoutes = require('./authRoutes');
const publicRoutes = require('./publicRoutes');
const catalogRoutes = require('./catalogRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const saleRoutes = require('./saleRoutes');
const customerRoutes = require('./customerRoutes');
const paymentRoutes = require('./paymentRoutes');
const reportRoutes = require('./reportRoutes');
const ApiError = require('../utils/ApiError');

const router = Router();

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/games', catalogRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', saleRoutes);
router.use('/customers', customerRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);

// Prefijo publicado en /api/v1
const apiRouter = Router();
apiRouter.use(apiPrefix, router);
apiRouter.use((_req, _res, next) => next(ApiError.notFound('Endpoint no encontrado')));

module.exports = apiRouter;
