'use strict';

const { Router } = require('express');
const validate = require('../middlewares/validate');
const { publicCatalogQuerySchema } = require('../validators/schemas');
const publicController = require('../controllers/publicController');

const router = Router();

// Sin authenticate: cualquiera puede ver el catálogo y el stock disponible.
// La compra (/sales) sigue exigiendo sesión y permiso sales.write.
router.get('/games/meta', publicController.meta);
router.get('/games', validate(publicCatalogQuerySchema), publicController.games);

module.exports = router;
