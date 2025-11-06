const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:MauRiqui2004@localhost:5432/miapp'
});

async function checkUsersTable() {
  try {
    console.log('🔍 Verificando tabla users...\n');
    
    // Ver estructura de la tabla users
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    if (structure.rows.length === 0) {
      console.log('❌ La tabla users NO EXISTE\n');
      await pool.end();
      return;
    }
    
    console.log('📊 Estructura de la tabla users:');
    structure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Ver primary key
    const pk = await pool.query(`
      SELECT constraint_name, column_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'users'
      AND constraint_name LIKE '%pkey%'
    `);
    
    console.log('\n🔑 Primary Key:');
    if (pk.rows.length > 0) {
      pk.rows.forEach(row => {
        console.log(`   - ${row.column_name}`);
      });
    } else {
      console.log('   ❌ No hay primary key definida');
    }
    
    // Contar usuarios
    const count = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\n👥 Total de usuarios: ${count.rows[0].count}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsersTable();