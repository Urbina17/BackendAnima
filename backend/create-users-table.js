const db = require('./src/db');

async function createUsersTable() {
  try {
    console.log('🔄 Creando tabla users...');
    
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(120),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(30) DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        reset_code_hash TEXT,
        reset_code_expires TIMESTAMPTZ,
        spotify_id TEXT
      );
    `;

    await db.query(query);
    console.log('✅ Tabla users creada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear tabla users:', error);
    process.exit(1);
  }
}

createUsersTable();