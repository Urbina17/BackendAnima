const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:MauRiqui2004@localhost:5432/miapp'
});

async function createPlaybackTable() {
  try {
    console.log('🔧 Creando tabla playback_history con UUID...\n');
    
    // Eliminar tabla si existe
    await pool.query(`DROP TABLE IF EXISTS playback_history CASCADE;`);
    console.log('🗑️ Tabla anterior eliminada (si existía)');
    
    // Crear tabla con user_id como UUID (para coincidir con users)
    await pool.query(`
      CREATE TABLE playback_history (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        track_uri VARCHAR(255) NOT NULL,
        track_name VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        album_image VARCHAR(500),
        external_url VARCHAR(500),
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_playback_user FOREIGN KEY (user_id) 
          REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    console.log('✅ Tabla playback_history creada (con UUID)');
    
    // Crear índices
    await pool.query(`
      CREATE INDEX idx_playback_user_id 
      ON playback_history(user_id);
    `);
    console.log('✅ Índice idx_playback_user_id creado');
    
    await pool.query(`
      CREATE INDEX idx_playback_played_at 
      ON playback_history(played_at DESC);
    `);
    console.log('✅ Índice idx_playback_played_at creado');
    
    await pool.query(`
      CREATE INDEX idx_playback_user_date 
      ON playback_history(user_id, played_at DESC);
    `);
    console.log('✅ Índice idx_playback_user_date creado');
    
    console.log('\n🎉 ¡Tabla e índices creados exitosamente!\n');
    
    // Verificar
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'playback_history'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Estructura de playback_history:');
    result.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    await pool.end();
    console.log('\n✅ Todo listo!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createPlaybackTable();