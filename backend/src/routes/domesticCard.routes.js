const express = require('express');
const router = express.Router();
const domesticCardService = require('../services/domesticCard.service');

// POST /api/domestic-card/check-eligibility
router.post('/check-eligibility', async (req, res) => {
  try {
    const result = await domesticCardService.checkEligibility(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/domestic-card/supported-rails
router.get('/supported-rails', (req, res) => {
  res.json({
    rupay_networks: [
      { alliance: 'Discover Financial Services', regions: 'USA, Canada, Global E-commerce', status: 'ACTIVE' },
      { alliance: 'JCB International', regions: 'Japan, Asia-Pacific, Europe', status: 'ACTIVE' },
      { alliance: 'Diners Club International', regions: 'Global Travel & Luxury merchants', status: 'ACTIVE' },
      { alliance: 'Pulse ATM Network', regions: 'North America POS & Cash Rails', status: 'ACTIVE' }
    ],
    upi_international_corridors: [
      { country: 'Singapore', clearing: 'PayNow & NETS QR', supported: true, currency: 'SGD' },
      { country: 'United Arab Emirates', clearing: 'Mashreq NeoPay QR', supported: true, currency: 'AED' },
      { country: 'France', clearing: 'Lyra Network (Eiffel Tower & Galleries Lafayette)', supported: true, currency: 'EUR' },
      { country: 'Mauritius', clearing: 'Bank of Mauritius MauCAS QR', supported: true, currency: 'MUR' },
      { country: 'Nepal', clearing: 'Fonepay Real-Time Interoperability', supported: true, currency: 'NPR' },
      { country: 'Bhutan', clearing: 'Royal Monetary Authority Interoperability', supported: true, currency: 'INR' },
      { country: 'Sri Lanka', clearing: 'LankaPay National Payment Network', supported: true, currency: 'LKR' }
    ],
    unsupported_notice: 'Standard domestic RuPay PMJDY and standard domestic UPI (without cross-border NIPL integration) are NOT supported for international foreign merchant checkout.'
  });
});

// POST /api/domestic-card/tcs-calculator
router.post('/tcs-calculator', (req, res) => {
  try {
    const { amount_inr, is_educational } = req.body;
    const calc = domesticCardService.calculateTcs(parseFloat(amount_inr || 0), Boolean(is_educational));
    res.json(calc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

