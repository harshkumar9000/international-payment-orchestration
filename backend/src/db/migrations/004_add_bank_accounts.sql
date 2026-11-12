-- Migration 004: Add Bank Accounts Table for Tokenized Payouts and Linked Accounts
-- 1. Creates bank_accounts table to securely store masked account references and tokens.
-- 2. Strictly avoids storing raw bank account numbers (only masked numbers and gateway tokens).
-- 3. Idempotently creates index on merchant_id for multi-tenant merchant isolation.

CREATE TABLE IF NOT EXISTS bank_accounts (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(128) NOT NULL,
    account_number_masked VARCHAR(64) NOT NULL,
    last_four VARCHAR(4) NOT NULL,
    routing_code VARCHAR(32) NOT NULL,
    account_type VARCHAR(32) DEFAULT 'checking',
    currency VARCHAR(8) DEFAULT 'USD',
    country VARCHAR(8) DEFAULT 'US',
    verification_status VARCHAR(32) DEFAULT 'VERIFIED',
    is_default BOOLEAN DEFAULT FALSE,
    token VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on merchant_id for fast queries and merchant isolation
CREATE INDEX IF NOT EXISTS idx_bank_accounts_merchant ON bank_accounts(merchant_id);

