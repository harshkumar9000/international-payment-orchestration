-- Migration 002: Add Saved Cards Table, Idempotency and Simulation Safeguards
-- 1. Creates saved_cards table for domestic RuPay and international tokenized cards.
-- 2. Adds idempotency_key and updated_at to guardian_approvals.
-- 3. Adds is_simulated and simulation_notice to refund_records.
-- 4. Creates supporting performance and integrity indexes.

-- 1. Saved Payment Cards Table
CREATE TABLE IF NOT EXISTS saved_cards (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL,
    cardholder_name VARCHAR(255) NOT NULL,
    card_number_masked VARCHAR(64) NOT NULL,
    last_four VARCHAR(4) NOT NULL,
    bin VARCHAR(16) NOT NULL,
    network VARCHAR(32) NOT NULL,
    card_type VARCHAR(128),
    issuing_bank VARCHAR(128),
    expiry VARCHAR(16),
    international_support VARCHAR(64),
    international_support_label VARCHAR(128),
    international_support_notes TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    token VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Guardian Approvals Safety Columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'guardian_approvals' AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE guardian_approvals ADD COLUMN idempotency_key VARCHAR(128);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'guardian_approvals' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE guardian_approvals ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 3. Refund Records Simulation Safeguard Columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refund_records' AND column_name = 'is_simulated'
    ) THEN
        ALTER TABLE refund_records ADD COLUMN is_simulated BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refund_records' AND column_name = 'simulation_notice'
    ) THEN
        ALTER TABLE refund_records ADD COLUMN simulation_notice TEXT;
    END IF;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_guardian_idempotency ON guardian_approvals(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_saved_cards_merchant ON saved_cards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_saved_cards_token ON saved_cards(token);

