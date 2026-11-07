const express = require('express');
const router = express.Router();
const compatibilityService = require('../services/compatibility.service');

// GET /check?country=DE&currency=EUR&amount=120
router.get('/check', (req, res) => {
  try {
    const { country, currency, amount } = req.query;
    const result = compatibilityService.checkCompatibility(country, currency, parseFloat(amount) || 100);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /matrix
router.get('/matrix', (req, res) => {
  res.json(compatibilityService.getCorridorMatrix());
});

module.exports = router;

