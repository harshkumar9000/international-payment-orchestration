/**
 * Database Access Layer
 * ATLAS.PAY Platform
 * 
 * Supports two clearly separated database modes:
 * 1. PostgreSQL mode (DB_PROVIDER=postgres): Connects to Supabase / PostgreSQL via pg.Pool.
 *    Performs all operations directly against PostgreSQL with parameterized queries,
 *    allowlisted tables and identifiers, zero dual-writing, and error propagation.
 * 2. Local JSON mode (DB_PROVIDER=json): Zero-dependency persistent embedded storage
 *    via local_store.json (or isolated test store) for offline local development and automated testing.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let currentProvider = 'json'; // 'postgres' | 'json'
let dbStatus = 'embedded_storage_active'; // 'postgresql_connected' | 'embedded_storage_active' | 'database_unavailable'
let lastDbError = null;

// Allowlisted table names to prevent SQL injection in dynamic identifier contexts
const ALLOWED_TABLES = new Set([
  'merchants',
  'providers',
  'routing_rules',
  'transactions',
  'routing_logs',
  'recovery_logs',
  'fraud_assessments',
  'student_profiles',
  'guardian_approvals',
  'refund_records',
  'agentic_audit_logs',
  'saved_cards',
  'schema_migrations'
]);

const TABLES_WITH_UPDATED_AT = new Set([
  'merchants',
  'providers',
  'routing_rules',
  'transactions',
  'student_profiles',
  'guardian_approvals',
  'refund_records',
  'saved_cards'
]);

function validateTableName(tableName) {
  if (!ALLOWED_TABLES.has(tableName)) {
    throw new Error(`[DB Error] Table '${tableName}' is not in the allowlist.`);
  }
}

function validateIdentifier(name) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`[DB Error] Invalid SQL identifier: '${name}'.`);
  }
}

// Local store file path
function getLocalStoreFile() {
  if (process.env.TEST_STORE_FILE) {
    return process.env.TEST_STORE_FILE;
  }
  return path.join(__dirname, 'local_store.json');
}

// In-memory data store structure for fallback
let fallbackStore = {
  merchants: [],
  providers: [],
  routing_rules: [],
  transactions: [],
  routing_logs: [],
  recovery_logs: [],
  fraud_assessments: [],
  student_profiles: [],
  guardian_approvals: [],
  refund_records: [],
  agentic_audit_logs: [],
  saved_cards: []
};

// Load existing local store if present
function loadFallbackStore() {
  try {
    const storeFile = getLocalStoreFile();
    if (fs.existsSync(storeFile)) {
      const data = fs.readFileSync(storeFile, 'utf8');
      fallbackStore = JSON.parse(data);
    }
  } catch (err) {
    console.warn('[DB] Warning loading fallback store file, initializing clean state:', err.message);
  }
}

// Persist fallback store to disk
function saveFallbackStore() {
  try {
    const storeFile = getLocalStoreFile();
    fs.writeFileSync(storeFile, JSON.stringify(fallbackStore, null, 2), 'utf8');
  } catch (err) {
    console.warn('[DB] Failed saving local fallback store:', err.message);
  }
}

// Mask password in database URLs for secure logging
function maskDatabaseUrl(url) {
  if (!url) return '';
  return url.replace(/:([^:@]+)@/, ':****@');
}

/**
 * Initialize connection based on DB_PROVIDER environment variable
 */
async function initDb(options = {}) {
  const reqProvider = (process.env.DB_PROVIDER || 'json').toLowerCase().trim();
  currentProvider = reqProvider === 'postgres' ? 'postgres' : 'json';

  if (currentProvider === 'json') {
    loadFallbackStore();
    dbStatus = 'embedded_storage_active';
    lastDbError = null;
    if (process.env.NODE_ENV !== 'test') {
      console.log('ℹ️ [DB] Running in Local JSON mode (embedded storage: local_store.json).');
    }
    return true;
  }

  // PostgreSQL mode
  dbStatus = 'database_unavailable';
  const databaseUrl = process.env.DATABASE_URL;

  // Verify connection string presence and placeholder replacement
  if (
    !databaseUrl ||
    databaseUrl.trim() === '' ||
    databaseUrl.includes('[YOUR-PASSWORD]') ||
    databaseUrl.includes('PASTE_YOUR_')
  ) {
    lastDbError = new Error('DATABASE_URL is missing or contains unreplaced placeholders. Set a valid PostgreSQL connection string in .env.');
    console.error('❌ [DB] PostgreSQL mode selected (DB_PROVIDER=postgres), but DATABASE_URL is missing or contains placeholders.');
    console.error('   Please provide your Supabase Session Pooler connection string in your root .env file.');
    if (options.throwOnError) {
      throw lastDbError;
    }
    return false;
  }

  // Reuse active healthy pool across serverless warm invocations
  if (pool && dbStatus === 'postgresql_connected') {
    return true;
  }

  try {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const maxPoolSize = process.env.DB_POOL_MAX
      ? parseInt(process.env.DB_POOL_MAX, 10)
      : (isServerless ? 1 : 10);

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: maxPoolSize,
      idleTimeoutMillis: isServerless ? 1000 : 30000,
      connectionTimeoutMillis: 5000
    });

    // Test connectivity
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    dbStatus = 'postgresql_connected';
    lastDbError = null;
    console.log(`✅ [DB] Connected successfully to Supabase PostgreSQL (${maskDatabaseUrl(databaseUrl)})`);
    return true;
  } catch (err) {
    dbStatus = 'database_unavailable';
    lastDbError = err;
    console.error(`❌ [DB] PostgreSQL connection failed: ${err.message}. Database marked as database_unavailable.`);
    if (pool) {
      try {
        await pool.end();
      } catch (_) {}
      pool = null;
    }
    if (options.throwOnError) {
      throw err;
    }
    return false;
  }
}

/**
 * Close database pool cleanly
 */
async function closeDb() {
  if (pool) {
    try {
      await pool.end();
    } catch (_) {}
    pool = null;
  }
  if (currentProvider === 'postgres') {
    dbStatus = 'database_unavailable';
  }
}

/**
 * Generic SQL query helper for PostgreSQL mode
 */
async function query(sql, params = []) {
  if (currentProvider !== 'postgres') {
    throw new Error('[DB Error] Direct SQL query is only supported when DB_PROVIDER=postgres.');
  }
  if (dbStatus !== 'postgresql_connected' || !pool) {
    throw new Error(`Database unavailable: PostgreSQL is configured but unreachable (${lastDbError ? lastDbError.message : 'Database offline'}).`);
  }
  try {
    const res = await pool.query(sql, params);
    return res.rows;
  } catch (err) {
    console.error('[DB Postgres Query Error]:', err.message);
    throw err;
  }
}

// Collection-based unified CRUD operations
const db = {
  init: initDb,
  close: closeDb,
  query,

  // Status accessors
  isPostgres: () => currentProvider === 'postgres' && dbStatus === 'postgresql_connected',
  isReady: () => dbStatus === 'postgresql_connected' || dbStatus === 'embedded_storage_active',
  getProvider: () => currentProvider,
  getStatus: () => dbStatus,
  getLastError: () => lastDbError,

  // Table operations
  table: (tableName) => {
    validateTableName(tableName);

    return {
      find: async (predicate = null) => {
        if (currentProvider === 'postgres') {
          if (dbStatus !== 'postgresql_connected' || !pool) {
            throw new Error(`Database unavailable: PostgreSQL is configured but connection is not active (${lastDbError ? lastDbError.message : 'Database offline'}).`);
          }
          const res = await pool.query(`SELECT * FROM ${tableName}`);
          const rows = res.rows;
          return predicate ? rows.filter(predicate) : rows;
        }

        loadFallbackStore();
        const collection = fallbackStore[tableName] || [];
        return predicate ? collection.filter(predicate) : [...collection];
      },

      findOne: async (predicate = null) => {
        if (currentProvider === 'postgres') {
          if (dbStatus !== 'postgresql_connected' || !pool) {
            throw new Error(`Database unavailable: PostgreSQL is configured but connection is not active (${lastDbError ? lastDbError.message : 'Database offline'}).`);
          }
          const res = await pool.query(`SELECT * FROM ${tableName}`);
          const rows = res.rows;
          return predicate ? (rows.find(predicate) || null) : (rows[0] || null);
        }

        loadFallbackStore();
        const collection = fallbackStore[tableName] || [];
        return predicate ? (collection.find(predicate) || null) : (collection[0] || null);
      },

      findById: async (id) => {
        if (currentProvider === 'postgres') {
          if (dbStatus !== 'postgresql_connected' || !pool) {
            throw new Error(`Database unavailable: PostgreSQL is configured but connection is not active (${lastDbError ? lastDbError.message : 'Database offline'}).`);
          }
          const res = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`, [id]);
          return res.rows[0] || null;
        }

        loadFallbackStore();
        const collection = fallbackStore[tableName] || [];
        return collection.find(item => item.id === id) || null;
      },

      insert: async (item) => {
        if (currentProvider === 'postgres') {
          if (dbStatus !== 'postgresql_connected' || !pool) {
            throw new Error(`Database unavailable: PostgreSQL is configured but connection is not active (${lastDbError ? lastDbError.message : 'Database offline'}).`);
          }
          const keys = Object.keys(item);
          for (const k of keys) {
            validateIdentifier(k);
          }
          const cols = keys.join(', ');
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const values = keys.map(k => {
            const v = item[k];
            return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
          });

          const sql = `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING RETURNING *`;
          const res = await pool.query(sql, values);
          if (res.rows && res.rows.length > 0) {
            return res.rows[0];
          }

          // If record already existed, return the existing database record
          if (item.id) {
            const existing = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`, [item.id]);
            if (existing.rows && existing.rows.length > 0) {
              return existing.rows[0];
            }
          }
          return item;
        }

        // Local JSON mode
        loadFallbackStore();
        if (!fallbackStore[tableName]) {
          fallbackStore[tableName] = [];
        }
        fallbackStore[tableName].push(item);
        saveFallbackStore();
        return item;
      },

      update: async (id, updates) => {
        if (currentProvider === 'postgres') {
          if (dbStatus !== 'postgresql_connected' || !pool) {
            throw new Error(`Database unavailable: PostgreSQL is configured but connection is not active (${lastDbError ? lastDbError.message : 'Database offline'}).`);
          }
          const keys = Object.keys(updates);
          if (keys.length === 0) {
            const res = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`, [id]);
            return res.rows[0] || null;
          }
          for (const k of keys) {
            validateIdentifier(k);
          }
          const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
          if (TABLES_WITH_UPDATED_AT.has(tableName) && !keys.includes('updated_at')) {
            setClauses.push('updated_at = NOW()');
          }
          const values = keys.map(k => {
            const v = updates[k];
            return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
          });
          values.push(id);

          const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`;
          const res = await pool.query(sql, values);
          return res.rows[0] || null;
        }

        // Local JSON mode
        loadFallbackStore();
        const collection = fallbackStore[tableName] || [];
        const index = collection.findIndex(item => item.id === id);
        let updatedItem = null;

        if (index !== -1) {
          collection[index] = { ...collection[index], ...updates, updated_at: new Date().toISOString() };
          updatedItem = collection[index];
          saveFallbackStore();
        }

        return updatedItem;
      },

      delete: async (id) => {
        if (currentProvider === 'postgres') {
          if (dbStatus !== 'postgresql_connected' || !pool) {
            throw new Error(`Database unavailable: PostgreSQL is configured but connection is not active (${lastDbError ? lastDbError.message : 'Database offline'}).`);
          }
          await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
          return true;
        }

        // Local JSON mode
        loadFallbackStore();
        if (fallbackStore[tableName]) {
          fallbackStore[tableName] = fallbackStore[tableName].filter(item => item.id !== id);
          saveFallbackStore();
        }
        return true;
      },

      count: async (predicate = null) => {
        if (currentProvider === 'postgres') {
          if (dbStatus !== 'postgresql_connected' || !pool) {
            throw new Error(`Database unavailable: PostgreSQL is configured but connection is not active (${lastDbError ? lastDbError.message : 'Database offline'}).`);
          }
          if (!predicate) {
            const res = await pool.query(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
            return parseInt(res.rows[0].count, 10);
          }
          const res = await pool.query(`SELECT * FROM ${tableName}`);
          return res.rows.filter(predicate).length;
        }

        // Local JSON mode
        loadFallbackStore();
        const collection = fallbackStore[tableName] || [];
        return predicate ? collection.filter(predicate).length : collection.length;
      }
    };
  },

  resetStore: () => {
    fallbackStore = {
      merchants: [],
      providers: [],
      routing_rules: [],
      transactions: [],
      routing_logs: [],
      recovery_logs: [],
      fraud_assessments: [],
      student_profiles: [],
      guardian_approvals: [],
      refund_records: [],
      agentic_audit_logs: [],
      saved_cards: []
    };
    saveFallbackStore();
  },

  // Test helper to inject mock pool in isolated unit tests
  _setMockPoolForTesting: (mockPool, provider = 'postgres', status = 'postgresql_connected') => {
    pool = mockPool;
    currentProvider = provider;
    dbStatus = status;
    lastDbError = null;
  }
};

module.exports = db;
