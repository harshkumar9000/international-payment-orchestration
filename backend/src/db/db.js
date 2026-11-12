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
const { Pool, types } = require('pg');
const fs = require('fs');
const path = require('path');

// Ensure PostgreSQL DATE (OID 1082) columns return clean 'YYYY-MM-DD' strings,
// preventing node-postgres local timezone shifts from corrupting calendar dates.
if (types && typeof types.setTypeParser === 'function') {
  types.setTypeParser(1082, (val) => val);
}

let PoolConstructor = Pool;
let pool = null;
let currentProvider = 'uninitialized'; // 'postgres' | 'json' | 'uninitialized'
let dbStatus = 'uninitialized'; // 'postgresql_connected' | 'embedded_storage_active' | 'database_unavailable' | 'uninitialized'
let lastDbError = null;
let isInitialized = false;
let initPromise = null;

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
  'guardian_profiles',
  'guardian_approvals',
  'refund_records',
  'agentic_audit_logs',
  'saved_cards',
  'bank_accounts',
  'schema_migrations'
]);

const TABLES_WITH_UPDATED_AT = new Set([
  'merchants',
  'providers',
  'routing_rules',
  'transactions',
  'student_profiles',
  'guardian_profiles',
  'guardian_approvals',
  'refund_records',
  'saved_cards',
  'bank_accounts'
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
  guardian_profiles: [],
  guardian_approvals: [],
  refund_records: [],
  agentic_audit_logs: [],
  saved_cards: [],
  bank_accounts: []
};

// Load existing local store if present
function loadFallbackStore() {
  if (process.env.VERCEL) {
    return; // Never read local_store.json in Vercel production
  }
  try {
    const storeFile = getLocalStoreFile();
    if (fs.existsSync(storeFile)) {
      const data = fs.readFileSync(storeFile, 'utf8');
      fallbackStore = JSON.parse(data);
      if (!Array.isArray(fallbackStore.guardian_profiles)) {
        fallbackStore.guardian_profiles = [];
      }
      if (!Array.isArray(fallbackStore.bank_accounts)) {
        fallbackStore.bank_accounts = [];
      }
      if (!Array.isArray(fallbackStore.saved_cards)) {
        fallbackStore.saved_cards = [];
      }
    }
  } catch (err) {
    console.warn('[DB] Warning loading fallback store file, initializing clean state:', err.message);
  }
}

// Persist fallback store to disk
function saveFallbackStore() {
  if (process.env.VERCEL) {
    return; // Never write local_store.json in Vercel production
  }
  try {
    const storeFile = getLocalStoreFile();
    fs.writeFileSync(storeFile, JSON.stringify(fallbackStore, null, 2), 'utf8');
  } catch (err) {
    console.warn('[DB] Failed saving local fallback store:', err.message);
  }
}

// Safe check if database URL targets port 6543 (Supabase Transaction/Session pooler)
function checkUsesPort6543(url) {
  if (!url || typeof url !== 'string') return false;
  return /:6543(\/|$|\?)/.test(url);
}

// Sanitize error messages to eliminate accidental password or token leakage
function sanitizeErrorMessage(msg) {
  if (!msg) return '';
  return String(msg)
    .replace(/:\/\/[^:]+:([^@]+)@/g, '://***:****@')
    .replace(/:([^:@\s]+)@/g, ':****@');
}

/**
 * Safe deployment diagnostics
 * Reports only: Runtime, Configured Provider, DATABASE_URL presence, Port 6543 check,
 * and Status/sanitized error. Never logs DATABASE_URL, passwords, or JWT secrets.
 */
function logDiagnostics({ runtime, configuredProvider, hasDatabaseUrl, usesPort6543, status, error = null }) {
  console.log('🔍 [DB Diagnostics] ----------------------------------------');
  console.log(`   Runtime:                    ${runtime}`);
  console.log(`   Configured Provider:        ${configuredProvider}`);
  console.log(`   DATABASE_URL Present:       ${hasDatabaseUrl}`);
  console.log(`   Supabase Pooler Port 6543:  ${usesPort6543 ? 'YES (Port 6543 Verified)' : 'NO (Verify port 6543 for serverless)'}`);
  console.log(`   Database Status:            ${status}`);
  if (error) {
    console.log(`   Diagnostics Notice:         ${sanitizeErrorMessage(error.message || error)}`);
  }
  console.log('-----------------------------------------------------------');
}

/**
 * Initialize connection based on environment and DB_PROVIDER
 * Cold-start safe, module-promise deduplicated, warm-invocation reusable.
 */
async function initDb(options = {}) {
  // If forced re-initialization requested (e.g. switching environments in tests)
  if (options.force) {
    initPromise = null;
    if (pool) {
      try {
        await pool.end();
      } catch (_) {}
      pool = null;
    }
    isInitialized = false;
    dbStatus = 'uninitialized';
    currentProvider = 'uninitialized';
  }

  const isVercel = Boolean(process.env.VERCEL);
  const targetProvider = (isVercel || (process.env.DB_PROVIDER || 'json').toLowerCase().trim() === 'postgres') ? 'postgres' : 'json';

  // Reuse active healthy pool across serverless warm invocations
  if (isInitialized && currentProvider === targetProvider) {
    if (targetProvider === 'postgres' && pool && dbStatus === 'postgresql_connected') {
      return true;
    }
    if (targetProvider === 'json' && dbStatus === 'embedded_storage_active') {
      return true;
    }
  }

  // Share in-flight initialization promise across concurrent requests
  if (initPromise) {
    return initPromise;
  }

  initPromise = _executeInit(options, isVercel, targetProvider).finally(() => {
    initPromise = null;
  });

  return initPromise;
}

async function _executeInit(options = {}, isVercel, targetProvider) {
  const runtime = isVercel ? 'Vercel Serverless' : 'Local / Dedicated Node.js';
  const rawProvider = (process.env.DB_PROVIDER || (isVercel ? 'postgres' : 'json')).toLowerCase().trim();
  const databaseUrl = process.env.DATABASE_URL || '';
  const hasDatabaseUrl = Boolean(databaseUrl && databaseUrl.trim().length > 0);
  const isPlaceholderUrl = databaseUrl.includes('[YOUR-PASSWORD]') || databaseUrl.includes('PASTE_YOUR_');
  const usesPort6543 = checkUsesPort6543(databaseUrl);

  currentProvider = targetProvider;

  if (isVercel && rawProvider !== 'postgres') {
    console.warn(`⚠️ [DB] DB_PROVIDER is set to '${rawProvider}', but Vercel requires 'postgres'. Enforcing PostgreSQL mode.`);
  }

  if (currentProvider === 'json') {
    if (isVercel) {
      // Hard security check: never allow local JSON mode on Vercel
      dbStatus = 'database_unavailable';
      isInitialized = true;
      lastDbError = new Error('Local JSON mode is completely disabled in Vercel production. PostgreSQL is required.');
      logDiagnostics({
        runtime,
        configuredProvider: 'json (rejected)',
        hasDatabaseUrl,
        usesPort6543,
        status: dbStatus,
        error: lastDbError
      });
      return false;
    }

    loadFallbackStore();
    dbStatus = 'embedded_storage_active';
    isInitialized = true;
    lastDbError = null;

    if (process.env.NODE_ENV !== 'test') {
      logDiagnostics({
        runtime,
        configuredProvider: 'json',
        hasDatabaseUrl,
        usesPort6543,
        status: dbStatus
      });
      console.log('ℹ️ [DB] Running in Local JSON mode (embedded storage: local_store.json).');
    }
    return true;
  }

  // PostgreSQL mode
  dbStatus = 'database_unavailable';

  // Verify connection string presence and placeholder replacement
  if (!hasDatabaseUrl || isPlaceholderUrl) {
    const reason = !hasDatabaseUrl
      ? 'DATABASE_URL is missing.'
      : 'DATABASE_URL contains unreplaced placeholder credentials ([YOUR-PASSWORD]).';

    lastDbError = new Error(`PostgreSQL configuration error: ${reason} Set a valid PostgreSQL connection string.`);
    isInitialized = true;

    logDiagnostics({
      runtime,
      configuredProvider: 'postgres',
      hasDatabaseUrl,
      usesPort6543,
      status: dbStatus,
      error: lastDbError
    });

    console.error(`❌ [DB] PostgreSQL mode selected, but ${reason}`);
    if (isVercel) {
      console.error('   In Vercel: Set DATABASE_URL in Project Settings -> Environment Variables with port 6543 (Transaction Pooler).');
    } else {
      console.error('   In Local: Provide your Supabase Session Pooler connection string in your root .env file.');
    }

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
    const isServerless = isVercel || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
    const maxPoolSize = process.env.DB_POOL_MAX
      ? parseInt(process.env.DB_POOL_MAX, 10)
      : (isServerless ? 1 : 10);

    if (!pool) {
      pool = new PoolConstructor({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        max: maxPoolSize,
        idleTimeoutMillis: isServerless ? 1000 : 30000,
        connectionTimeoutMillis: 5000
      });
    }

    // Test connectivity
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    dbStatus = 'postgresql_connected';
    lastDbError = null;
    isInitialized = true;

    logDiagnostics({
      runtime,
      configuredProvider: 'postgres',
      hasDatabaseUrl: true,
      usesPort6543,
      status: dbStatus
    });

    console.log('✅ [DB] Connected successfully to Supabase PostgreSQL pool.');
    return true;
  } catch (err) {
    dbStatus = 'database_unavailable';
    lastDbError = err;
    isInitialized = true;

    logDiagnostics({
      runtime,
      configuredProvider: 'postgres',
      hasDatabaseUrl: true,
      usesPort6543,
      status: dbStatus,
      error: err
    });

    console.error(`❌ [DB] PostgreSQL connection failed: ${sanitizeErrorMessage(err.message)}. Database marked as database_unavailable.`);
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
  isInitialized = false;
  initPromise = null;
  if (currentProvider === 'postgres') {
    dbStatus = 'database_unavailable';
  } else {
    dbStatus = 'uninitialized';
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
  isReady: () => isInitialized && (dbStatus === 'postgresql_connected' || dbStatus === 'embedded_storage_active'),
  isInitialized: () => isInitialized,
  getProvider: () => currentProvider,
  getStatus: () => dbStatus,
  getLastError: () => lastDbError,

  // Table operations
  table: (tableName) => {
    validateTableName(tableName);

    if (process.env.VERCEL && currentProvider !== 'postgres') {
      throw new Error(`[DB Security Error] Table operation on '${tableName}' blocked: PostgreSQL is required in Vercel production.`);
    }

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
    if (process.env.VERCEL) {
      throw new Error('[DB Security Error] resetStore() cannot be called in Vercel production.');
    }
    fallbackStore = {
      merchants: [],
      providers: [],
      routing_rules: [],
      transactions: [],
      routing_logs: [],
      recovery_logs: [],
      fraud_assessments: [],
      student_profiles: [],
      guardian_profiles: [],
      guardian_approvals: [],
      refund_records: [],
      agentic_audit_logs: [],
      saved_cards: [],
      bank_accounts: []
    };
    saveFallbackStore();
  },

  // Test helper to inject custom Pool constructor (for mocking in unit tests)
  _setPoolConstructorForTesting: (customPoolConstructor) => {
    PoolConstructor = customPoolConstructor || Pool;
  },

  // Test helper to inject mock pool in isolated unit tests
  _setMockPoolForTesting: (mockPool, provider = 'postgres', status = 'postgresql_connected', initialized = true) => {
    pool = mockPool;
    currentProvider = provider;
    dbStatus = status;
    lastDbError = null;
    isInitialized = initialized;
  },

  _getPoolForTesting: () => pool,

  _resetForTesting: () => {
    pool = null;
    currentProvider = 'uninitialized';
    dbStatus = 'uninitialized';
    lastDbError = null;
    isInitialized = false;
    initPromise = null;
    PoolConstructor = Pool;
  }
};

module.exports = db;
