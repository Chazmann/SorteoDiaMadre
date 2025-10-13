// src/lib/db.ts
import { config } from 'dotenv';
import { Pool } from 'pg';

config();

// Use Pool for connection management, which is best practice
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    // Render requires SSL but does not require certificate verification
    rejectUnauthorized: false,
  },
});

export default pool;
