const fs = require('fs');
const path = require('path');
const db = require('./db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const runMigrations = async (logger) => {
  const log = logger || { info: console.log, error: console.error, warn: console.warn };

  // Create tracking table if it doesn't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id   SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await db.query('SELECT id FROM _migrations WHERE name = $1', [file]);
    if (rows.length > 0) {
      log.info({ migration: file }, 'skipped (already applied)');
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await db.query(sql);
      await db.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      log.info({ migration: file }, 'applied');
    } catch (err) {
      log.error({ migration: file, err: err.message }, 'migration failed');
      throw err;
    }
  }
};

module.exports = { runMigrations };
