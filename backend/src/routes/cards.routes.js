/**
 * Domestic & International Card Management Routes
 * ATLAS.PAY Platform
 * Provides secure simulated tokenization and card linking for Indian & Global cards.
 * IMPORTANT: CVV and full primary account numbers (PAN) are NEVER stored.
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const { optionalAuth } = require('../middleware/auth.middleware');

// Apply optional auth middleware to all cards routes
router.use(optionalAuth);

// RuPay BIN classification rule database
const RUPAY_GLOBAL_BINS = ['6521', '6522', '6528', '6530', '6531', '6080', '6081', '6082', '6083', '6085'];
const RUPAY_DOMESTIC_BINS = ['6070', '6071', '6072', '6073', '6074', '6075', '6076', '6077', '6078', '6079'];

function detectCardNetwork(cleanNumber, providedNetwork) {
  if (providedNetwork && ['RuPay', 'Visa', 'Mastercard'].includes(providedNetwork)) {
    return providedNetwork;
  }
  if (cleanNumber.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'Mastercard';
  if (cleanNumber.startsWith('60') || cleanNumber.startsWith('65') || cleanNumber.startsWith('81') || cleanNumber.startsWith('82')) return 'RuPay';
  return 'RuPay';
}

function evaluateCardSupport(network, bin) {
  const binPrefix4 = bin.slice(0, 4);
  const binPrefix2 = bin.slice(0, 2);

  if (network === 'RuPay') {
    if (RUPAY_GLOBAL_BINS.some(b => bin.startsWith(b))) {
      return {
        international_support: 'SUPPORTED',
        international_support_label: 'International Enabled',
        card_type: 'RuPay Global (Discover/Diners/JCB Co-badged)',
        international_support_notes: 'Eligible for cross-border ecommerce via Discover and Diners Club International reciprocal networks.'
      };
    } else if (RUPAY_DOMESTIC_BINS.some(b => bin.startsWith(b))) {
      return {
        international_support: 'DOMESTIC_ONLY',
        international_support_label: 'Domestic Only (India)',
        card_type: 'RuPay Classic / PMJDY Domestic',
        international_support_notes: 'Domestic debit card. Not enabled for foreign merchant billing. Use RuPay Global or Visa/Mastercard instead.'
      };
    } else {
      return {
        international_support: 'VERIFICATION_REQUIRED',
        international_support_label: 'Verification Required',
        card_type: 'RuPay Standard',
        international_support_notes: 'Card may require bank netbanking activation for international e-commerce limits.'
      };
    }
  }

  if (network === 'Visa') {
    return {
      international_support: 'SUPPORTED',
      international_support_label: 'International Enabled',
      card_type: 'Visa International',
      international_support_notes: 'Full cross-border ecommerce with 3D Secure / EMV 3DS verification.'
    };
  }

  if (network === 'Mastercard') {
    return {
      international_support: 'SUPPORTED',
      international_support_label: 'International Enabled',
      card_type: 'Mastercard Global',
      international_support_notes: 'Global cross-border authorization with Mastercard Identity Check.'
    };
  }

  return {
    international_support: 'SUPPORTED',
    international_support_label: 'International Enabled',
    card_type: `${network} Card`,
    international_support_notes: 'Global payment card supported on international rails.'
  };
}

// GET /api/cards - List linked cards
router.get('/', async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const cards = await db.table('saved_cards').find(c => c.merchant_id === merchantId || !c.merchant_id);
    
    // Sort default card first, then newest
    const sorted = [...cards].sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json({ cards: sorted });
  } catch (err) {
    console.error('[Cards List Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve linked cards' });
  }
});

// POST /api/cards - Link a new card (Tokenized, CVV discarded)
router.post('/', async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const {
      cardholder_name,
      card_number,
      expiry,
      cvv, // received only for mock tokenization handshake, NEVER stored
      network: providedNetwork,
      issuing_bank,
      is_default
    } = req.body;

    if (!cardholder_name || !cardholder_name.trim()) {
      return res.status(400).json({ error: 'Cardholder name is required' });
    }

    const cleanNumber = (card_number || '').replace(/\D/g, '');
    if (cleanNumber.length < 15 || cleanNumber.length > 19) {
      return res.status(400).json({ error: 'Please enter a valid 15 or 16-digit card number' });
    }

    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry.trim())) {
      return res.status(400).json({ error: 'Expiry date must be in MM/YY format' });
    }

    if (!cvv || (cvv.trim().length !== 3 && cvv.trim().length !== 4)) {
      return res.status(400).json({ error: 'CVV security code must be 3 or 4 digits' });
    }

    const network = detectCardNetwork(cleanNumber, providedNetwork);
    const bin = cleanNumber.slice(0, 6);
    const lastFour = cleanNumber.slice(-4);
    const maskedNumber = `•••• •••• •••• ${lastFour}`;
    const bank = (issuing_bank && issuing_bank.trim()) || 'HDFC Bank';

    const supportEvaluation = evaluateCardSupport(network, bin);

    // Check if user has existing cards; if first, set as default
    const existingCards = await db.table('saved_cards').find(c => c.merchant_id === merchantId || !c.merchant_id);
    const shouldBeDefault = existingCards.length === 0 || Boolean(is_default);

    if (shouldBeDefault && existingCards.length > 0) {
      for (const card of existingCards) {
        if (card.is_default) {
          await db.table('saved_cards').update(card.id, { is_default: false });
        }
      }
    }

    const newCard = {
      id: `card_${uuidv4().slice(0, 12)}`,
      merchant_id: merchantId,
      cardholder_name: cardholder_name.trim(),
      card_number_masked: maskedNumber,
      last_four: lastFour,
      bin: bin,
      network: network,
      card_type: supportEvaluation.card_type,
      issuing_bank: bank,
      expiry: expiry.trim(),
      international_support: supportEvaluation.international_support,
      international_support_label: supportEvaluation.international_support_label,
      international_support_notes: supportEvaluation.international_support_notes,
      is_default: shouldBeDefault,
      token: `tok_sim_${network.toLowerCase()}_${lastFour}_${Date.now().toString(36)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.table('saved_cards').insert(newCard);

    res.status(201).json({
      success: true,
      message: 'Card securely tokenized and linked',
      card: newCard
    });
  } catch (err) {
    console.error('[Card Create Error]:', err);
    res.status(500).json({ error: 'Failed to link card' });
  }
});

// PUT /api/cards/:id/default - Set card as default
router.put('/:id/default', async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const cardId = req.params.id;

    const cards = await db.table('saved_cards').find(c => c.merchant_id === merchantId || !c.merchant_id);
    const target = cards.find(c => c.id === cardId);

    if (!target) {
      return res.status(404).json({ error: 'Card not found' });
    }

    for (const card of cards) {
      await db.table('saved_cards').update(card.id, { is_default: card.id === cardId });
    }

    const updated = await db.table('saved_cards').findById(cardId);
    res.json({ success: true, message: 'Default payment card updated', card: updated });
  } catch (err) {
    console.error('[Card Set Default Error]:', err);
    res.status(500).json({ error: 'Failed to update default card' });
  }
});

// DELETE /api/cards/:id - Remove card
router.delete('/:id', async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const cardId = req.params.id;

    const cards = await db.table('saved_cards').find(c => c.merchant_id === merchantId || !c.merchant_id);
    const target = cards.find(c => c.id === cardId);

    if (!target) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await db.table('saved_cards').delete(cardId);

    // If deleted card was default, make the next one default if any exist
    if (target.is_default) {
      const remaining = cards.filter(c => c.id !== cardId);
      if (remaining.length > 0) {
        await db.table('saved_cards').update(remaining[0].id, { is_default: true });
      }
    }

    res.json({ success: true, message: 'Card removed successfully' });
  } catch (err) {
    console.error('[Card Delete Error]:', err);
    res.status(500).json({ error: 'Failed to remove card' });
  }
});

module.exports = router;

