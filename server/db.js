const { Pool } = require('pg');
require('dotenv').config();

const isLocal = (() => {
  try {
    const url = new URL(process.env.DATABASE_URL);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch { return false; }
})();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
