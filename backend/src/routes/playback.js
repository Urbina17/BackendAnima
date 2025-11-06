const express = require('express');
const router = express.Router();
const playbackController = require('../controllers/playbackController');
const auth = require('../middlewares/auth');

/**
 * @route POST /api/playback/add
 * @desc Agrega una canción al historial de reproducción
 * @access Private (requiere autenticación)
 */
router.post('/add', auth, playbackController.agregarCancionAlHistorial);

/**
 * @route GET /api/playback/recent
 * @desc Obtiene las últimas canciones reproducidas
 * @query limit - Número de canciones (default: 10)
 * @access Private
 */
router.get('/recent', auth, playbackController.obtenerHistorialReciente);

/**
 * @route GET /api/playback/stats
 * @desc Obtiene estadísticas del historial de reproducción
 * @access Private
 */
router.get('/stats', auth, playbackController.obtenerEstadisticas);

/**
 * @route DELETE /api/playback/clear
 * @desc Elimina todo el historial del usuario
 * @access Private
 */
router.delete('/clear', auth, playbackController.limpiarHistorial);

module.exports = router;