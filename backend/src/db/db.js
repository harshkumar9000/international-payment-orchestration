/**
 * Dual Database Access Layer
 * Supports PostgreSQL / Supabase (via pg Pool) with an automatic resilient
 * persistent fallback for zero-dependency local development and testing.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let isPostgresActive = false;

// Local fallback store path
const LOCAL_STORE_FILE = path.join(__dirname, 'local_store.json');

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
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORE_FILE, 'utf8');
      fallbackStore = JSON.parse(data);
    }
  } catch (err) {
    console.warn('[DB] Warning loading fallback store file, initializing clean state:', err.message);
  }
}

// Persist fallback store to disk
function saveFallbackStore() {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(fallbackStore, null, 2), 'utf8');
  } catch (err) {
    console.warn('[DB] Failed saving local fallback store:', err.message);
  }
}

// Initialize connection
async function initDb() {
  loadFallbackStore();

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.trim() !== '') {
    try {
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('supabase') || databaseUrl.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : false,
        connectionTimeoutMillis: 3000
      });

      // Quick test query
      const client = await pool.connect();
      client.release();
      isPostgresActive = true;
      console.log('✅ [DB] Connected successfully to PostgreSQL / Supabase');

      // Auto run schema migrations
      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await pool.query(schemaSql);
      console.log('✅ [DB] PostgreSQL schema initialized.');
      return;
    } catch (err) {
      console.warn(`⚠️ [DB] PostgreSQL connection failed (${err.message}). Using local embedded storage.`);
      isPostgresActive = false;
    }
  } else {
    console.log('ℹ️ [DB] DATABASE_URL not set. Running with embedded persistent storage.');
  }
}

// Generic query helper
async function query(sql, params = []) {
  if (isPostgresActive && pool) {
    try {
      const res = await pool.query(sql, params);
      return res.rows;
    } catch (err) {
      console.error('[DB Postgres Query Error]:', err.message);
      throw err;
    }
  }

  // Fallback engine: in-memory mock for common queries
  return [];
}

// Collection-based unified CRUD operations
const db = {
  isPostgres: () => isPostgresActive,

  init: initDb,

  // Table queries
  table: (tableName) => {
    if (!isPostgresActive) {
      loadFallbackStore();
    }
    return {
      find: async (predicate = null) => {
        if (isPostgresActive && pool) {
          try {
            const res = await pool.query(`SELECT * FROM ${tableName}`);
            const rows = res.rows;
            return predicate ? rows.filter(predicate) : rows;
          } catch (e) {
            console.warn(`[DB Postgres query error on ${tableName}]:`, e.message);
          }
        }
        const collection = fallbackStore[tableName] || [];
        return predicate ? collection.filter(predicate) : [...collection];
      },

      findOne: async (predicate) => {
        if (isPostgresActive && pool) {
          try {
            const res = await pool.query(`SELECT * FROM ${tableName}`);
            return res.rows.find(predicate) || null;
          } catch (e) {
            console.warn(`[DB Postgres findOne error]:`, e.message);
          }
        }
        const collection = fallbackStore[tableName] || [];
        return collection.find(predicate) || null;
      },

      findById: async (id) => {
        if (isPostgresActive && pool) {
          try {
            const res = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
            return res.rows[0] || null;
          } catch (e) {
            console.warn(`[DB Postgres findById error]:`, e.message);
          }
        }
        const collection = fallbackStore[tableName] || [];
        return collection.find(item => item.id === id) || null;
      },

      insert: async (item) => {
        if (!fallbackStore[tableName]) {
          fallbackStore[tableName] = [];
        }
        fallbackStore[tableName].push(item);
        saveFallbackStore();

        if (isPostgresActive && pool) {
          try {
            const keys = Object.keys(item);
            const cols = keys.join(', ');
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const values = keys.map(k => {
              const v = item[k];
              return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
            });
            await pool.query(`INSERT INTO ${tableName} (${cols}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`, values);
          } catch (err) {
            console.warn(`[DB Postgres insert warning]:`, err.message);
          }
        }

        return item;
      },

      update: async (id, updates) => {
        const collection = fallbackStore[tableName] || [];
        const index = collection.findIndex(item => item.id === id);
        let updatedItem = null;

        if (index !== -1) {
          collection[index] = { ...collection[index], ...updates, updated_at: new Date().toISOString() };
          updatedItem = collection[index];
          saveFallbackStore();
        }

        if (isPostgresActive && pool) {
          try {
            const keys = Object.keys(updates);
            if (keys.length > 0) {
              const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
              const values = keys.map(k => {
                const v = updates[k];
                return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
              });
              values.push(id);
              await pool.query(`UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${values.length}`, values);
            }
          } catch (err) {
            console.warn(`[DB Postgres update warning]:`, err.message);
          }
        }

        return updatedItem;
      },

      delete: async (id) => {
        if (fallbackStore[tableName]) {
          fallbackStore[tableName] = fallbackStore[tableName].filter(item => item.id !== id);
          saveFallbackStore();
        }

        if (isPostgresActive && pool) {
          try {
            await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
          } catch (err) {
            console.warn(`[DB Postgres delete warning]:`, err.message);
          }
        }

        return true;
      },

      count: async (predicate = null) => {
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
  }
};

module.exports = db;

