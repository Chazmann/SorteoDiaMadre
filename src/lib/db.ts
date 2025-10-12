// src/lib/db.ts
import mysql from 'mysql2/promise';

// Configura los detalles de la conexión usando variables de entorno
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Descomenta la siguiente sección para producción si usas SSL
  /*
  ssl: {
    // Es necesario para conexiones externas en muchos proveedores de nube
    rejectUnauthorized: false
  }
  */
});

export default pool;