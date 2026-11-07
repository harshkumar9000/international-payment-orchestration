const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production-min-32-chars-long';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Provide demo merchant context if unauthenticated in development for ease of testing
    if (process.env.NODE_ENV !== 'production' && req.headers['x-demo-merchant']) {
      req.merchant = {
        id: 'mer_demo_orchestration_01',
        email: 'merchant@example.com',
        role: 'merchant'
      };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.merchant = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }
}

// Optional auth: if token present, decodes it; otherwise defaults to demo merchant
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.merchant = jwt.verify(token, JWT_SECRET);
      return next();
    } catch (err) {
      // Continue as demo merchant
    }
  }

  req.merchant = {
    id: 'mer_demo_orchestration_01',
    email: 'merchant@example.com',
    role: 'merchant'
  };
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  JWT_SECRET
};

