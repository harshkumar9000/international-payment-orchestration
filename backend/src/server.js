/**
 * Main Express Application Server
 * International Payment Orchestration Platform
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from parent root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const db = require('./db/db');
const pythonBridge = require('./services/pythonBridge.service');

// Route Handlers
const authRoutes = require('./routes/auth.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const currencyRoutes = require('./routes/currency.routes');
const compatibilityRoutes = require('./routes/compatibility.routes');
const routingRoutes = require('./routes/routing.routes');
const fraudRoutes = require('./routes/fraud.routes');
const recoveryRoutes = require('./routes/recovery.routes');
const transactionsRoutes = require('./routes/transactions.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const providersRoutes = require('./routes/providers.routes');
const webhooksRoutes = require('./routes/webhooks.routes');
const domesticCardRoutes = require('./routes/domesticCard.routes');
const agenticRefundRoutes = require('./routes/agenticRefund.routes');
const studentRoutes = require('./routes/student.routes');
const guardianRoutes = require('./routes/guardian.routes');
const cardsRoutes = require('./routes/cards.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Global Security & Parsers
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Environment-Based CORS Configuration
// Restrict production CORS strictly to configured FRONTEND_URL (supports comma-separated list for preview origins)
const rawFrontendUrls = [
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGINS
].filter(Boolean).join(',');

const allowedOrigins = rawFrontendUrls
  ? rawFrontendUrls.split(',').map(u => u.trim().replace(/\/+$/, '')).filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. cURL, health monitors, internal calls)
    if (!origin) return callback(null, true);

    // In non-production environments, allow localhost and testing origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, strictly validate against the configured allowed origins list
    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    const isAllowed = allowedOrigins.includes(normalizedOrigin);

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error(`[CORS] Origin '${origin}' is not authorized by ATLAS.PAY security policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-merchant']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Module-scoped initialization promise ensuring first serverless request triggers
// initialization, and concurrent requests await the exact same in-flight attempt.
let serverlessInitPromise = null;

function ensureDbInitialized() {
  if (db.isReady()) {
    return Promise.resolve(true);
  }
  if (!serverlessInitPromise) {
    serverlessInitPromise = db.init({ throwOnError: false })
      .catch(err => {
        console.error('❌ [Database Init Error]:', err.message);
        return false;
      })
      .finally(() => {
        if (!db.isReady()) {
          serverlessInitPromise = null;
        }
      });
  }
  return serverlessInitPromise;
}

// Database initialization middleware (cold-start safe for serverless and development)
app.use(async (req, res, next) => {
  try {
    await ensureDbInitialized();
  } catch (err) {
    console.error('❌ [Serverless DB Init Middleware Error]:', err.message);
  }
  next();
});

// Request Logger (Development)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Root Service Information
app.get('/', (req, res) => {
  res.json({
    service: 'ATLAS.PAY International Payment Orchestration API',
    status: 'online',
    version: '1.0.0',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/routing', routingRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/domestic-card', domesticCardRoutes);
app.use('/api/agentic-refund', agenticRefundRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/guardian', guardianRoutes);
app.use('/api/cards', cardsRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const pyHealth = await pythonBridge.getHealth();
  const dbStatus = db.getStatus();
  res.json({
    status: dbStatus === 'database_unavailable' ? 'degraded' : 'online',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'healthy',
      database: dbStatus,
      python_intelligence: pyHealth.online ? 'connected' : 'offline_fallback_active'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server function
async function startServer() {
  const dbOk = await ensureDbInitialized();
  if (db.getProvider() === 'postgres' && !dbOk) {
    console.warn('⚠️ [Backend] Started in PostgreSQL mode, but database is unavailable. Database endpoints will report failure until a valid DATABASE_URL is provided.');
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 [Backend] International Payment Orchestration Server running on port ${PORT}`);
    console.log(`🔗 [Backend] API URL: http://localhost:${PORT}/api/health`);
    console.log(`💾 [Backend] Database Mode: ${db.getProvider().toUpperCase()} (${db.getStatus()})`);
  });

  // Clean shutdown hook
  const shutdown = async () => {
    console.log('\n🛑 [Backend] Gracefully shutting down...');
    server.close(async () => {
      await db.close();
      serverlessInitPromise = null;
      console.log('✅ [Backend] Closed database pool and HTTP server.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return { app, server };
}

function _resetServerlessInitPromiseForTesting() {
  serverlessInitPromise = null;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, ensureDbInitialized, _resetServerlessInitPromiseForTesting };

