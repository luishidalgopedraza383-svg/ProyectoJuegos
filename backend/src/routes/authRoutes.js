'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validators/schemas');
const authController = require('../controllers/authController');

const router = Router();

// Límite agresivo solo para el login: frena fuerza bruta/bots desde móvil o PC.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Solo cuentan los intentos fallidos: un usuario legítimo no consume su cupo.
  skipSuccessfulRequests: true,
  message: { error: { message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' } },
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);

router.use(authenticate);
router.get('/me', authController.me);
router.get('/permissions', authController.permissions);

module.exports = router;
