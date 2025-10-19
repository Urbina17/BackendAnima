const db = require('./src/db');

async function createExtension() {
  try {
    console.log('🔄 Creando extensión uuid-ossp...');
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ Extensión uuid-ossp creada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createExtension();