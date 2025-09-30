const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const { forgotLimiter } = require('../middlewares/rateLimiter');

router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  controller.register);

router.post('/login',
  body('email').isEmail(),
  body('password').exists(),
  controller.login);

router.post('/forgot-password',
  body('email').isEmail(),
  forgotLimiter,
  controller.forgotPassword);

router.post('/reset-password',
  body('email').isEmail(),
  body('code').isLength({ min: 4 }),
  body('newPassword').isLength({ min: 6 }),
  controller.resetPassword);

module.exports = router;
