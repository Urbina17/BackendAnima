const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL en Neon"))
  .catch(err => console.error("❌ Error de conexión a PostgreSQL:", err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
