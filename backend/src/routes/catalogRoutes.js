'use strict';

const { Router } = require('express');
const { authenticate, requirePermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createGameSchema, updateGameSchema, listGamesSchema } = require('../validators/schemas');
const uploadCover = require('../middlewares/upload');
const catalogController = require('../controllers/catalogController');

const router = Router();

router.use(authenticate);

// Taxonomía para los formularios de catálogo (antes de /:id para no colisionar).
router.get('/meta', requirePermission('catalog.read'), catalogController.meta);

router.get('/', requirePermission('catalog.read'), validate(listGamesSchema), catalogController.list);
router.get('/:id', requirePermission('catalog.read'), validate(updateGameSchema.pick({ params: true })), catalogController.get);
router.post('/', requirePermission('catalog.write'), validate(createGameSchema), catalogController.create);
// Subida de portada: multipart/form-data con el campo "image".
router.post('/:id/image', requirePermission('catalog.write'), validate(updateGameSchema.pick({ params: true })), uploadCover, catalogController.uploadImage);
router.patch('/:id', requirePermission('catalog.write'), validate(updateGameSchema), catalogController.update);

module.exports = router;
