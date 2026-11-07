const express = require('express');
const router = express.Router();
const currencyService = require('../services/currency.service');
const { optionalAuth, requireAuth } = require('../middleware/auth.middleware');
const db = require('../db/db');

// GET /rates
router.get('/rates', (req, res) => {
  const data = currencyService.getRates();
  res.json(data);
});

// POST /convert
router.post('/convert', optionalAuth, async (req, res) => {
  try {
    const { amount, from_currency, to_currency, custom_markup } = req.body;
    if (!amount || !from_currency || !to_currency) {
      return res.status(400).json({ error: 'amount, from_currency, and to_currency are required.' });
    }

    let markup = custom_markup;
    if (markup === undefined && req.merchant) {
      const merchant = await db.table('merchants').findById(req.merchant.id);
      if (merchant && merchant.markup_percentage) {
        markup = merchant.markup_percentage;
      }
    }

    const conversion = currencyService.convertAmount(amount, from_currency, to_currency, markup ?? 1.25);
    res.json(conversion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /markup
router.get('/markup', requireAuth, async (req, res) => {
  try {
    const merchant = await db.table('merchants').findById(req.merchant.id);
    res.json({
      markup_percentage: merchant?.markup_percentage ?? 1.25
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /markup
router.put('/markup', requireAuth, async (req, res) => {
  try {
    const { markup_percentage } = req.body;
    const num = parseFloat(markup_percentage);
    if (isNaN(num) || num < 0 || num > 15) {
      return res.status(400).json({ error: 'Markup percentage must be a number between 0% and 15%.' });
    }

    await db.table('merchants').update(req.merchant.id, { markup_percentage: num });
    res.json({
      message: 'Merchant markup updated successfully',
      markup_percentage: num
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

