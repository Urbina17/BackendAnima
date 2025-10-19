const db = require('./src/db');

async function checkTable() {
  try {
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'emotion_analyses'
      ORDER BY ordinal_position
    `);

    if (result.rows.length > 0) {
      console.log('✅ La tabla emotion_analyses EXISTE con estas columnas:');
      result.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ La tabla emotion_analyses NO EXISTE');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTable();