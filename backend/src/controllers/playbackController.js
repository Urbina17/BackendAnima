const db = require('../db');

/**
 * Guarda una canción reproducida en el historial
 * POST /api/playback/add
 */
exports.agregarCancionAlHistorial = async (req, res) => {
  try {
    const userId = req.user.id;
    const { trackUri, trackName, artist, album, albumImage, externalUrl } = req.body;

    // Validar datos requeridos
    if (!trackUri || !trackName || !artist) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: trackUri, trackName y artist son obligatorios'
      });
    }

    console.log(`🎵 Guardando canción en historial - Usuario: ${userId}, Canción: ${trackName}`);

    const query = `
      INSERT INTO playback_history 
        (user_id, track_uri, track_name, artist, album, album_image, external_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      userId,
      trackUri,
      trackName,
      artist,
      album || '',
      albumImage || '',
      externalUrl || ''
    ];

    const result = await db.query(query, values);

    console.log(`✅ Canción guardada con ID: ${result.rows[0].id}`);

    return res.status(201).json({
      success: true,
      message: 'Canción agregada al historial',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error al agregar canción al historial:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar en el historial',
      error: error.message
    });
  }
};

/**
 * Obtiene las últimas canciones reproducidas por el usuario
 * GET /api/playback/recent?limit=10
 */
exports.obtenerHistorialReciente = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`📊 Obteniendo historial reciente - Usuario: ${userId}, Límite: ${limit}`);

    const query = `
      SELECT 
        id,
        track_uri,
        track_name,
        artist,
        album,
        album_image,
        external_url,
        played_at
      FROM playback_history
      WHERE user_id = $1
      ORDER BY played_at DESC
      LIMIT $2;
    `;

    const result = await db.query(query, [userId, limit]);

    // Formatear respuesta
    const tracks = result.rows.map(row => ({
      id: row.id,
      uri: row.track_uri,
      name: row.track_name,
      artist: row.artist,
      album: row.album,
      albumImage: row.album_image,
      externalUrl: row.external_url,
      playedAt: row.played_at
    }));

    console.log(`✅ Historial obtenido: ${tracks.length} canciones`);

    return res.status(200).json({
      success: true,
      count: tracks.length,
      tracks: tracks
    });

  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el historial',
      error: error.message
    });
  }
};

/**
 * Obtiene estadísticas del historial de reproducción
 * GET /api/playback/stats
 */
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total de canciones reproducidas
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM playback_history
      WHERE user_id = $1;
    `;

    // Artista más escuchado
    const topArtistQuery = `
      SELECT artist, COUNT(*) as play_count
      FROM playback_history
      WHERE user_id = $1
      GROUP BY artist
      ORDER BY play_count DESC
      LIMIT 1;
    `;

    // Canción más escuchada
    const topTrackQuery = `
      SELECT track_name, artist, COUNT(*) as play_count
      FROM playback_history
      WHERE user_id = $1
      GROUP BY track_name, artist
      ORDER BY play_count DESC
      LIMIT 1;
    `;

    // Canciones únicas
    const uniqueTracksQuery = `
      SELECT COUNT(DISTINCT track_uri) as unique_tracks
      FROM playback_history
      WHERE user_id = $1;
    `;

    const [totalResult, topArtistResult, topTrackResult, uniqueTracksResult] = await Promise.all([
      db.query(totalQuery, [userId]),
      db.query(topArtistQuery, [userId]),
      db.query(topTrackQuery, [userId]),
      db.query(uniqueTracksQuery, [userId])
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalPlays: parseInt(totalResult.rows[0]?.total || 0),
        uniqueTracks: parseInt(uniqueTracksResult.rows[0]?.unique_tracks || 0),
        topArtist: topArtistResult.rows[0] || null,
        topTrack: topTrackResult.rows[0] || null
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Limpia el historial completo del usuario
 * DELETE /api/playback/clear
 */
exports.limpiarHistorial = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      DELETE FROM playback_history
      WHERE user_id = $1
      RETURNING COUNT(*);
    `;

    const result = await db.query(query, [userId]);

    console.log(`🗑️ Historial limpiado - Usuario: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Historial limpiado correctamente',
      deletedCount: result.rowCount
    });

  } catch (error) {
    console.error('❌ Error al limpiar historial:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al limpiar el historial',
      error: error.message
    });
  }
};