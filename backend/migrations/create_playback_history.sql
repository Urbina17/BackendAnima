-- Tabla para guardar el historial de reproducción de música
CREATE TABLE IF NOT EXISTS playback_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    track_uri VARCHAR(255) NOT NULL,
    track_name VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    album_image VARCHAR(500),
    external_url VARCHAR(500),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key a la tabla users
    CONSTRAINT fk_playback_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_playback_user_id ON playback_history(user_id);
CREATE INDEX IF NOT EXISTS idx_playback_played_at ON playback_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_user_date ON playback_history(user_id, played_at DESC);

-- Comentarios
COMMENT ON TABLE playback_history IS 'Historial de reproducción de canciones por usuario';
COMMENT ON COLUMN playback_history.track_uri IS 'URI de Spotify de la canción (ej: spotify:track:...)';
COMMENT ON COLUMN playback_history.played_at IS 'Fecha y hora en que se reprodujo la canción';