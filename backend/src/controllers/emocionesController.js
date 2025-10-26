const db = require('../db');
const rekognitionService = require('../utils/rekognition');
const { getRecommendationsByEmotion } = require('../utils/spotifyRecommendations');

/**
 * Analiza la emoción de una imagen y genera playlist
 */
exports.analizarEmocion = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user.id;
    const spotifyToken = req.headers['x-spotify-token'];

    console.log("🔍 Token de Spotify recibido:", spotifyToken ? "SÍ" : "NO");

    if (!image) {
      return res.status(400).json({ 
        success: false,
        message: "No se proporcionó ninguna imagen" 
      });
    }

    console.log("📸 Analizando imagen para usuario:", userId);

    // Detectar emociones con AWS Rekognition
    const resultado = await rekognitionService.detectEmotions(image);

    if (resultado.error) {
      console.error("❌ Error en Rekognition:", resultado.error);
      return res.status(400).json({ 
        success: false,
        message: resultado.error 
      });
    }

    // Mapear emociones de AWS a español con iconos
    const emocionesMap = {
      HAPPY: { name: "Felicidad", icon: "😊" },
      SAD: { name: "Tristeza", icon: "😢" },
      ANGRY: { name: "Enojo", icon: "😠" },
      CONFUSED: { name: "Confusión", icon: "😕" },
      DISGUSTED: { name: "Disgusto", icon: "🤢" },
      SURPRISED: { name: "Sorpresa", icon: "😲" },
      CALM: { name: "Calma", icon: "😌" },
      FEAR: { name: "Miedo", icon: "😨" }
    };

    const emocionPrincipal = emocionesMap[resultado.principal] || { 
      name: "Calma", 
      icon: "😌" 
    };

    // Guardar en la base de datos
    const query = `
      INSERT INTO emotion_analyses (user_id, emotion_detected, confidence, all_emotions)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      userId,
      emocionPrincipal.name,
      Math.round(resultado.confianza * 100) / 100,
      JSON.stringify(resultado.emociones)
    ];

    const dbResult = await db.query(query, values);
    console.log("✅ Emoción guardada en BD:", dbResult.rows[0].id);

    // Generar playlist de Spotify según la emoción
    let playlist = null;
    if (spotifyToken) {
      console.log("🎵 Generando playlist para:", emocionPrincipal.name);
      playlist = await getRecommendationsByEmotion(emocionPrincipal.name, spotifyToken);
      
      if (playlist.error) {
        console.warn("⚠️ No se pudo generar playlist:", playlist.error);
      } else {
        console.log("✅ Playlist generada:", playlist.total, "canciones");
      }
    } else {
      console.warn("⚠️ No se proporcionó token de Spotify, no se generará playlist");
    }

    return res.status(200).json({
      success: true,
      emotion: {
        id: dbResult.rows[0].id,
        name: emocionPrincipal.name,
        icon: emocionPrincipal.icon,
        confidence: Math.round(resultado.confianza),
        allEmotions: resultado.emociones,
        createdAt: dbResult.rows[0].created_at
      },
      playlist: playlist && !playlist.error ? playlist.tracks : null
    });

  } catch (error) {
    console.error("❌ Error al analizar emoción:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

/**
 * Obtiene el historial de análisis de emociones del usuario
 */
exports.obtenerHistorial = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const query = `
      SELECT id, emotion_detected, confidence, all_emotions, created_at
      FROM emotion_analyses
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);

    return res.status(200).json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });

  } catch (error) {
    console.error("❌ Error al obtener historial:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al obtener historial" 
    });
  }
};

/**
 * Obtiene estadísticas detalladas del usuario
 */
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total de análisis
    const totalQuery = await db.query(
      'SELECT COUNT(*) as total FROM emotion_analyses WHERE user_id = $1',
      [userId]
    );

    // Emociones por tipo
    const emocionesQuery = await db.query(
      `SELECT 
        emotion_detected as emocion,
        COUNT(*) as cantidad,
        ROUND(AVG(confidence), 2) as confianza_promedio
       FROM emotion_analyses 
       WHERE user_id = $1
       GROUP BY emotion_detected
       ORDER BY cantidad DESC`,
      [userId]
    );

    // Últimos 7 días
    const ultimos7DiasQuery = await db.query(
      `SELECT 
        DATE(created_at) as fecha,
        COUNT(*) as cantidad
       FROM emotion_analyses 
       WHERE user_id = $1 
         AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY fecha DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      estadisticas: {
        totalAnalisis: parseInt(totalQuery.rows[0].total),
        emocionesPorTipo: emocionesQuery.rows,
        ultimos7Dias: ultimos7DiasQuery.rows
      }
    });

  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al obtener estadísticas" 
    });
  }
};