// src/lib/db.ts
import { Pool } from 'pg';

// Configura los detalles de la conexión usando variables de entorno
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render proporciona esta variable de entorno
  ssl: {
    // Es necesario para conexiones externas en Render
    rejectUnauthorized: false
  }
});

export default pool;
