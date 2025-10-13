// src/lib/db.ts
import { config } from 'dotenv';
import { Pool } from 'pg';

config();

// Use a connection string, which is the standard for services like Render.
// This is more robust and less prone to configuration errors.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Render requires SSL but does not require certificate verification from the client.
    rejectUnauthorized: false,
  },
});

export default pool;
