/**
 * Bank Account Linking & Settlement Rail Routes
 * ATLAS.PAY Platform
 * Provides secure simulated tokenization and bank account linking for payouts and debits.
 * IMPORTANT: Full bank account numbers are NEVER stored. Only masked numbers and tokenized references.
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const { optionalAuth } = require('../middleware/auth.middleware');

router.use(optionalAuth);

// GET /api/bank-accounts - List linked bank accounts for the authenticated merchant
router.get('/', async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const accounts = await db.table('bank_accounts').find(a => a.merchant_id === merchantId);

    accounts.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json({
      success: true,
      bank_accounts: accounts
    });
  } catch (err) {
    console.error('[Bank Accounts List Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve linked bank accounts' });
  }
});

// POST /api/bank-accounts - Link a new bank account securely
router.post('/', async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const {
      account_holder_name,
      bank_name,
      account_number,
      routing_code,
      account_type = 'checking',
      currency = 'USD',
      country = 'US',
      is_default = false
    } = req.body;

    if (!account_holder_name || !account_holder_name.trim()) {
      return res.status(400).json({ error: 'Account holder name is required' });
    }
    if (!bank_name || !bank_name.trim()) {
      return res.status(400).json({ error: 'Bank name is required' });
    }

    const cleanAcct = (account_number || '').replace(/\D/g, '');
    if (cleanAcct.length < 6 || cleanAcct.length > 20) {
      return res.status(400).json({ error: 'Please enter a valid bank account number (6-20 digits)' });
    }

    const cleanRouting = (routing_code || '').trim().toUpperCase();
    if (cleanRouting.length < 4 || cleanRouting.length > 20) {
      return res.status(400).json({ error: 'Valid IFSC / SWIFT / Routing number is required' });
    }

    const lastFour = cleanAcct.slice(-4);
    const maskedNumber = `•••• •••• ${lastFour}`;

    const existingAccounts = await db.table('bank_accounts').find(a => a.merchant_id === merchantId);
    const shouldBeDefault = Boolean(is_default) || existingAccounts.length === 0;

    if (shouldBeDefault) {
      for (const acc of existingAccounts) {
        if (acc.is_default) {
          await db.table('bank_accounts').update(acc.id, { is_default: false });
        }
      }
    }

    const newAccount = {
      id: `bank_${uuidv4().substring(0, 10)}`,
      merchant_id: merchantId,
      account_holder_name: account_holder_name.trim(),
      bank_name: bank_name.trim(),
      account_number_masked: maskedNumber,
      last_four: lastFour,
      routing_code: cleanRouting,
      account_type: ['checking', 'savings', 'current'].includes(String(account_type).toLowerCase())
        ? String(account_type).toLowerCase()
        : 'checking',
      currency: String(currency || 'USD').toUpperCase().slice(0, 8),
      country: String(country || 'US').toUpperCase().slice(0, 8),
      verification_status: 'VERIFIED',
      is_default: shouldBeDefault,
      token: `ba_sim_${lastFour}_${Date.now().toString(36)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.table('bank_accounts').insert(newAccount);

    res.status(201).json({
      success: true,
      message: 'Bank account verified and linked securely',
      bank_account: newAccount
    });
  } catch (err) {
    console.error('[Bank Account Link Error]:', err);
    res.status(500).json({ error: 'Failed to link bank account' });
  }
});

// PUT /api/bank-accounts/:id/default - Set linked bank account as primary settlement rail
router.put('/:id/default', async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const accountId = req.params.id;

    const accounts = await db.table('bank_accounts').find(a => a.merchant_id === merchantId);
    const target = accounts.find(a => a.id === accountId);

    if (!target) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    for (const acc of accounts) {
      await db.table('bank_accounts').update(acc.id, { is_default: acc.id === accountId });
    }

    const updated = await db.table('bank_accounts').findById(accountId);
    res.json({ success: true, message: 'Default bank account updated', bank_account: updated });
  } catch (err) {
    console.error('[Bank Account Default Error]:', err);
    res.status(500).json({ error: 'Failed to update default bank account' });
  }
});

// DELETE /api/bank-accounts/:id - Unlink bank account
router.delete('/:id', async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const accountId = req.params.id;

    const accounts = await db.table('bank_accounts').find(a => a.merchant_id === merchantId);
    const target = accounts.find(a => a.id === accountId);

    if (!target) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    await db.table('bank_accounts').delete(accountId);

    if (target.is_default) {
      const remaining = accounts.filter(a => a.id !== accountId);
      if (remaining.length > 0) {
        await db.table('bank_accounts').update(remaining[0].id, { is_default: true });
      }
    }

    res.json({ success: true, message: 'Bank account unlinked successfully' });
  } catch (err) {
    console.error('[Bank Account Delete Error]:', err);
    res.status(500).json({ error: 'Failed to unlink bank account' });
  }
});

module.exports = router;

