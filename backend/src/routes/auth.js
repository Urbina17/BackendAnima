const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const auth = require('../middlewares/auth'); 
const { forgotLimiter } = require('../middlewares/rateLimiter');
const { addToken } = require("../utils/tokenBlacklist");
const authMiddleware = require("../middlewares/auth");

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


router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(400).json({ message: "No hay token para cerrar sesión" });
  }

  const token = authHeader.split(" ")[1];
  addToken(token);

  res.json({ message: "Sesión cerrada correctamente" });
});

router.get("/verify-token", authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

router.get('/profile', auth, controller.getProfile); // ✅ Usar controller
router.put('/profile', auth, controller.updateProfile); // ✅ Usar controller

module.exports = router;
