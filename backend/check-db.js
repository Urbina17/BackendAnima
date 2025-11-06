const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:MauRiqui2004@localhost:5432/miapp'
});

async function checkDatabase() {
  try {
    console.log('🔍 Conectando a la base de datos...\n');
    
    // Verificar conexión
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa\n');
    
    // Listar tablas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas en la base de datos:');
    if (tables.rows.length === 0) {
      console.log('❌ No hay tablas creadas\n');
    } else {
      tables.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      console.log('');
    }
    
    // Verificar tabla playback_history específicamente
    const checkPlayback = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'playback_history'
      )
    `);
    
    if (checkPlayback.rows[0].exists) {
      console.log('✅ La tabla playback_history EXISTE');
      
      // Ver estructura
      const structure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'playback_history'
        ORDER BY ordinal_position
      `);
      
      console.log('📊 Estructura de playback_history:');
      structure.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ La tabla playback_history NO EXISTE');
      console.log('\n🔧 Necesitas ejecutar el script de migración');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();