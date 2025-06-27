const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'toko_wa',
  user: 'toko_user',
  password: 'toko123'
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', res.rows[0]);
    
    const products = await pool.query('SELECT COUNT(*) FROM products');
    console.log('📦 Total products:', products.rows[0].count);
    
    await pool.end();
  } catch (err) {
    console.error('❌ Database error:', err);
  }
}

testConnection();
