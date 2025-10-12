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
  // Habilitar SSL si es necesario (común en proveedores de bases de datos en la nube)
  ssl: {
    rejectUnauthorized: true 
  }
});

export default pool;
