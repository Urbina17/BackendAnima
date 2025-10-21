const fetch = require('node-fetch');

/**
 * Mapeo de emociones a queries de búsqueda de playlists
 */
const emotionToSearchQuery = {
  'Felicidad': 'happy vibes',
  'Tristeza': 'sad songs',
  'Enojo': 'angry workout',
  'Calma': 'calm relaxing',
  'Sorpresa': 'surprise party',
  'Miedo': 'dark ambient',
  'Disgusto': 'aggressive rock',
  'Confusión': 'chill vibes'
};

/**
 * Obtiene playlists de Spotify según la emoción
 */
exports.getRecommendationsByEmotion = async (emotion, spotifyToken) => {
  try {
    const searchQuery = emotionToSearchQuery[emotion] || 'chill music';
    
    console.log("🎯 Buscando playlists para:", emotion);
    console.log("🔍 Query de búsqueda:", searchQuery);
    
    // Buscar playlists públicas
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=playlist&limit=10`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${spotifyToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("📡 Respuesta de Spotify:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error de Spotify API (Status", response.status + "):", errorText);
      return { error: 'No se pudieron obtener playlists de Spotify' };
    }

    const data = await response.json();
    
    console.log("📊 Playlists encontradas:", data.playlists?.items?.length || 0);
    
    if (!data.playlists || !data.playlists.items || data.playlists.items.length === 0) {
      console.warn("⚠️ No se encontraron playlists");
      return { error: 'No se encontraron playlists para esta emoción' };
    }

    // Buscar la primera playlist que tenga tracks disponibles
    let firstPlaylist = null;
    for (const playlist of data.playlists.items) {
      if (playlist && playlist.tracks && playlist.tracks.href) {
        firstPlaylist = playlist;
        break;
      }
    }

    if (!firstPlaylist) {
      console.error("❌ No se encontró una playlist válida");
      return { error: 'No se encontraron playlists válidas' };
    }

    console.log("📀 Playlist seleccionada:", firstPlaylist.name);
    
    // Obtener los tracks de la playlist
    const tracksResponse = await fetch(firstPlaylist.tracks.href + '?limit=20', {
      headers: {
        'Authorization': `Bearer ${spotifyToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tracksResponse.ok) {
      console.error("❌ Error obteniendo tracks de la playlist");
      return { error: 'No se pudieron obtener las canciones' };
    }

    const tracksData = await tracksResponse.json();
    
    if (!tracksData.items || tracksData.items.length === 0) {
      console.error("❌ La playlist no tiene canciones");
      return { error: 'La playlist está vacía' };
    }
    
    const tracks = tracksData.items
      .filter(item => item && item.track && item.track.id && item.track.name) // Filtrar tracks inválidos
      .map(item => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists?.map(a => a.name).join(', ') || 'Artista Desconocido',
        album: item.track.album?.name || 'Álbum Desconocido',
        albumImage: item.track.album?.images?.[0]?.url || null,
        duration: item.track.duration_ms || 0,
        previewUrl: item.track.preview_url || null,
        uri: item.track.uri || null,
        externalUrl: item.track.external_urls?.spotify || null
      }))
      .filter(track => track.id); // Asegurar que todos tengan ID

    if (tracks.length === 0) {
      console.error("❌ No se pudieron procesar las canciones");
      return { error: 'No se encontraron canciones válidas' };
    }

    console.log("✅ Playlist generada:", tracks.length, "canciones");
    console.log("🎵 Primera canción:", tracks[0]?.name, "por", tracks[0]?.artist);

    return {
      emotion,
      playlistName: firstPlaylist.name || 'Playlist sin nombre',
      playlistImage: firstPlaylist.images?.[0]?.url || null,
      playlistUrl: firstPlaylist.external_urls?.spotify || null,
      tracks,
      total: tracks.length
    };

  } catch (error) {
    console.error("❌ Error obteniendo playlists:", error);
    console.error("Stack:", error.stack);
    return { error: 'Error al procesar playlists' };
  }
};