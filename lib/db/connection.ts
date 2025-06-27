import { Pool } from 'pg';

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'toko_wa',
  user: process.env.DB_USER || 'toko_user',
  password: process.env.DB_PASSWORD || 'toko123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query function with logging
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log query in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executed', { 
        text: text.substring(0, 100) + '...', 
        duration, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
export async function transaction(callback: (client: any) => Promise<any>) {
  const client = await pool.connect();
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
}

export default pool;
