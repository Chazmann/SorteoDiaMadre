
// src/lib/db.ts
import { config } from 'dotenv';
import { Pool } from 'pg';

config();

// Use an object-based configuration to precisely control connection parameters,
// mirroring the successful DBeaver setup. This is more explicit than a connection string.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  ssl: {
    // This is equivalent to DBeaver's 'SSL mode: require'.
    // It enforces an SSL connection but does not require client-side certificate verification.
    rejectUnauthorized: false,
  },
});

export default pool;
