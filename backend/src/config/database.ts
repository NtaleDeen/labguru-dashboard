import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query logging configuration
const LOG_QUERIES = process.env.LOG_QUERIES === 'true';
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10);

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Only log if explicitly enabled or if query is slow
    if (LOG_QUERIES || duration > SLOW_QUERY_THRESHOLD) {
      const queryType = text.trim().split(/\s+/)[0].toUpperCase(); // SELECT, INSERT, etc.
      const logMsg = `Query took ${duration}ms: ${queryType} (${res.rowCount} rows)`;

      if (duration > SLOW_QUERY_THRESHOLD) {
        console.warn(`⚠️  SLOW QUERY: ${logMsg}`);
      } else {
        console.log(logMsg);
      }
    }

    return res;
  } catch (error) {
    const queryType = text.trim().split(/\s+/)[0].toUpperCase();
    console.error(`❌ Database query error (${queryType}):`, error);
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};

export const transaction = async (callback: (client: PoolClient) => Promise<any>) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default { query, getClient, transaction, pool };