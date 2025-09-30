const rateLimit = require('express-rate-limit');

exports.forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
});
