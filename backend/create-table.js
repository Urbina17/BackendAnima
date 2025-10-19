const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Conectarse a la base de datos por defecto 'postgres'
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // Base de datos por defecto
    password: 'MauRiqui2004',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('🔄 Verificando si existe la base de datos miapp...');

    // Verificar si la base de datos existe
    const checkDB = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = 'miapp'`
    );

    if (checkDB.rows.length === 0) {
      console.log('📦 Creando base de datos miapp...');
      await client.query('CREATE DATABASE miapp');
      console.log('✅ Base de datos miapp creada exitosamente');
    } else {
      console.log('✅ La base de datos miapp ya existe');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

createDatabase();