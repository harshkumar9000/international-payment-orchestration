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

const app = express();
const PORT = process.env.PORT || 5001;

// Global Security & Parsers
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-merchant']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  }
  next();
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

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const pyHealth = await pythonBridge.getHealth();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'healthy',
      database: db.isPostgres() ? 'postgresql_connected' : 'embedded_storage_active',
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
  await db.init();

  const server = app.listen(PORT, () => {
    console.log(`🚀 [Backend] International Payment Orchestration Server running on port ${PORT}`);
    console.log(`🔗 [Backend] API URL: http://localhost:${PORT}/api/health`);
  });

  return { app, server };
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

