const db = require('./src/db');

async function createTable() {
  try {
    console.log('🔄 Creando tabla emotion_analyses...');
    
    const query = `
      CREATE TABLE IF NOT EXISTS emotion_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emotion_detected VARCHAR(50) NOT NULL,
        confidence DECIMAL(5,2) NOT NULL,
        all_emotions JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_emotion_analyses_user_id ON emotion_analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_emotion_analyses_created_at ON emotion_analyses(created_at DESC);
    `;

    await db.query(query);
    console.log('✅ Tabla emotion_analyses creada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear tabla:', error);
    process.exit(1);
  }
}

createTable();