const express = require("express");
const router = express.Router();
const emocionesController = require("../controllers/emocionesController");
const auth = require("../middlewares/auth");

// POST /emociones/analizar - Analiza la emoción de una foto y genera playlist
router.post("/analizar", auth, emocionesController.analizarEmocion);

// GET /emociones/historial - Obtiene el historial de análisis
router.get("/historial", auth, emocionesController.obtenerHistorial);

module.exports = router;