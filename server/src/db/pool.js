import pg from 'pg';
import { env, isProduction } from '../config/env.js';

const { Pool } = pg;

// A single shared connection pool for the whole server process.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  // Managed Postgres providers typically require SSL; local dev does not.
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  // A pooled client threw while idle — log it rather than crashing the process.
  console.error('Unexpected Postgres pool error:', err);
});

/** Convenience wrapper for one-off queries. */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run a function inside a transaction, committing on success and rolling back
 * on error. The callback receives a dedicated client — use it for every query
 * in the transaction.
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
