/**
 * Database Migration Runner
 * Safe, versioned, idempotent SQL migration runner for Supabase PostgreSQL.
 * Tracks applied migrations in the schema_migrations table.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from parent root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function runMigrations() {
  const provider = (process.env.DB_PROVIDER || 'json').toLowerCase().trim();

  if (provider !== 'postgres') {
    console.error('❌ [Migration] Cannot run SQL migrations in Local JSON mode.');
    console.error('   To run migrations against Supabase PostgreSQL:');
    console.error('   1. Set DB_PROVIDER=postgres in your root .env file');
    console.error('   2. Set your valid DATABASE_URL in your root .env file');
    console.error('   3. Run: npm run db:migrate');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === '' || databaseUrl.includes('[YOUR-PASSWORD]') || databaseUrl.includes('PASTE_YOUR_')) {
    console.error('❌ [Migration] DATABASE_URL is not set or contains unreplaced placeholders.');
    console.error('   Please add your real Supabase Session Pooler connection string in .env:');
    console.error('   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-[region].pooler.supabase.com:5432/postgres');
    process.exit(1);
  }

  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`🚀 [Migration] Connecting to Supabase PostgreSQL (${maskedUrl})...`);

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  const client = await pool.connect();

  try {
    // 1. Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Query applied migrations
    const res = await client.query('SELECT name FROM schema_migrations ORDER BY id ASC');
    const appliedSet = new Set(res.rows.map(r => r.name));

    // 3. Read migration directory
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️ [Migration] No migrations directory found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  ✓ Already applied: ${file}`);
        continue;
      }

      console.log(`  ⏳ Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Run within a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✅ Applied: ${file}`);
        appliedCount++;
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Failed applying ${file}:`, migrationErr.message);
        throw migrationErr;
      }
    }

    if (appliedCount === 0) {
      console.log('✨ [Migration] Database schema is already up to date (0 pending migrations).');
    } else {
      console.log(`✨ [Migration] Successfully applied ${appliedCount} new migration(s).`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations().catch(err => {
    console.error('❌ Migration process exited with error:', err.message);
    process.exit(1);
  });
}

module.exports = runMigrations;

