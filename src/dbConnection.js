const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});


db.getConnection()
  .then(conn => {
    console.log("✅ Conectado correctamente a la base de datos");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error al conectar a la base de datos:", err.message);
  });

module.exports = { db };
