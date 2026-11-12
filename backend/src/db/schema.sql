-- ==============================================================================
-- ATLAS.PAY — International Payment Orchestration Platform
-- PostgreSQL & Supabase Canonical Database Schema
-- ==============================================================================

-- Enable UUID extension if PostgreSQL / Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Migration Tracking Table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Merchants / Platform Users
CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    default_currency VARCHAR(3) DEFAULT 'USD',
    markup_percentage NUMERIC(5, 2) DEFAULT 1.25,
    api_key VARCHAR(128) UNIQUE,
    role VARCHAR(32) DEFAULT 'merchant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Providers Profile & Metrics
CREATE TABLE IF NOT EXISTS providers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    base_fee_percent NUMERIC(5, 2) NOT NULL,
    base_fee_fixed NUMERIC(6, 4) NOT NULL,
    avg_latency_ms INTEGER NOT NULL,
    success_rate NUMERIC(5, 4) NOT NULL,
    uptime NUMERIC(6, 4) NOT NULL,
    supported_currencies TEXT NOT NULL, -- JSON array
    supported_methods TEXT NOT NULL,    -- JSON array
    supported_countries TEXT NOT NULL,  -- JSON array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Merchant Intelligent Routing Rules
CREATE TABLE IF NOT EXISTS routing_rules (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    priority_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    condition_json TEXT NOT NULL,
    target_provider VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Ledger
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    customer_amount NUMERIC(12, 2) DEFAULT 0.00,
    customer_currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate NUMERIC(12, 6) DEFAULT 1.0,
    customer_email VARCHAR(255),
    customer_country VARCHAR(2) DEFAULT 'US',
    payment_method VARCHAR(64) NOT NULL,
    primary_provider VARCHAR(64) DEFAULT 'stripe',
    executed_provider VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL, -- 'settled', 'recovered', 'failed', 'blocked', 'pending', 'pending_3ds', 'pending_parent_approval', 'refunded'
    risk_score INTEGER DEFAULT 0,
    risk_level VARCHAR(32) DEFAULT 'LOW',
    decline_code VARCHAR(64),
    decline_reason TEXT,
    fee_charged NUMERIC(10, 4) DEFAULT 0.0,
    latency_ms INTEGER DEFAULT 0,
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Routing Audit Trail
CREATE TABLE IF NOT EXISTS routing_logs (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    candidates_json TEXT NOT NULL,
    chosen_provider VARCHAR(64) NOT NULL,
    cascade_order_json TEXT,
    rationale TEXT
);

-- Recovery Attempts Log
CREATE TABLE IF NOT EXISTS recovery_logs (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    original_provider VARCHAR(64) NOT NULL,
    retry_provider VARCHAR(64) NOT NULL,
    decline_code VARCHAR(64) NOT NULL,
    is_successful BOOLEAN DEFAULT FALSE,
    strategy_used VARCHAR(128) NOT NULL,
    recovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fraud Assessments Audit
CREATE TABLE IF NOT EXISTS fraud_assessments (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64),
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR(32) NOT NULL,
    decision VARCHAR(32) NOT NULL,
    triggered_rules_json TEXT,
    score_breakdown_json TEXT,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Under-18 and Student Account Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) DEFAULT 'mer_demo_orchestration_01',
    user_id VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    date_of_birth DATE, -- Nullable to allow unverified student record creation without classifying as adult
    is_minor BOOLEAN DEFAULT TRUE,
    institution_name VARCHAR(255) NOT NULL,
    student_id_number VARCHAR(64),
    guardian_id VARCHAR(64),
    guardian_email VARCHAR(255) NOT NULL,
    guardian_name VARCHAR(255) NOT NULL,
    guardian_consent_status VARCHAR(32) DEFAULT 'ACTIVE', -- 'PENDING', 'ACTIVE', 'REVOKED'
    daily_limit NUMERIC(10, 2) DEFAULT 100.00,
    weekly_limit NUMERIC(10, 2) DEFAULT 400.00,
    monthly_limit NUMERIC(10, 2) DEFAULT 1200.00,
    single_tx_limit NUMERIC(10, 2) DEFAULT 250.00,
    auto_approval_threshold NUMERIC(10, 2) DEFAULT 50.00,
    whitelisted_mccs TEXT, -- JSON array of allowed category tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parent / Guardian Profiles
CREATE TABLE IF NOT EXISTS guardian_profiles (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL,
    guardian_name VARCHAR(255) NOT NULL,
    guardian_email VARCHAR(255) NOT NULL,
    relationship VARCHAR(64) DEFAULT 'Parent',
    default_daily_limit NUMERIC(10, 2) DEFAULT 100.00,
    default_weekly_limit NUMERIC(10, 2) DEFAULT 400.00,
    default_monthly_limit NUMERIC(10, 2) DEFAULT 1200.00,
    auto_approval_threshold NUMERIC(10, 2) DEFAULT 50.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parent / Guardian Approval Queue (With Idempotency & Audit)
CREATE TABLE IF NOT EXISTS guardian_approvals (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    guardian_id VARCHAR(64) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    merchant_name VARCHAR(255) NOT NULL,
    merchant_category VARCHAR(64) NOT NULL,
    purpose_description TEXT,
    status VARCHAR(32) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED_DUPLICATE'
    decision_reason TEXT,
    idempotency_key VARCHAR(128),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agentic Refund Ledger (Idempotent & Audited with Simulation Safeguards)
CREATE TABLE IF NOT EXISTS refund_records (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    provider_refund_id VARCHAR(128),
    reason_code VARCHAR(64) NOT NULL,
    reason_description TEXT,
    status VARCHAR(32) DEFAULT 'INITIATED', -- 'INITIATED', 'PROCESSING', 'SETTLED', 'FAILED', 'HELD_FOR_APPROVAL'
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    agent_evaluated BOOLEAN DEFAULT TRUE,
    agent_confidence_score NUMERIC(4, 2) DEFAULT 0.95,
    customer_notified BOOLEAN DEFAULT TRUE,
    initiated_by VARCHAR(64) DEFAULT 'AI_AGENT_AUTONOMOUS',
    is_simulated BOOLEAN DEFAULT TRUE,
    simulation_notice TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agentic Audit Trail (Autonomous decisions, status queries, safe retry logs)
CREATE TABLE IF NOT EXISTS agentic_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    provider_status_verified VARCHAR(64) NOT NULL,
    agent_reasoning TEXT NOT NULL,
    decision VARCHAR(64) NOT NULL,
    requires_human_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved Payment Cards (Domestic RuPay & International Tokenized Cards)
-- IMPORTANT: Full PAN and CVV are NEVER stored. Only masked numbers and gateway tokens.
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

-- Saved Bank Accounts (Settlement & Payment Rails)
-- IMPORTANT: Full account numbers are NEVER stored. Only masked numbers and tokenized references.
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

-- Processed Webhooks Ledger (Idempotency and deduplication)
CREATE TABLE IF NOT EXISTS processed_webhooks (
    id VARCHAR(128) PRIMARY KEY,
    provider VARCHAR(32) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    resource_id VARCHAR(128),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tx_merchant_created ON transactions(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_currency ON transactions(currency);
CREATE INDEX IF NOT EXISTS idx_tx_provider ON transactions(executed_provider);
CREATE INDEX IF NOT EXISTS idx_routing_merchant ON routing_rules(merchant_id, priority_order ASC);
CREATE INDEX IF NOT EXISTS idx_student_email ON student_profiles(email);
CREATE INDEX IF NOT EXISTS idx_guardian_pending ON guardian_approvals(guardian_id, status);
CREATE INDEX IF NOT EXISTS idx_guardian_idempotency ON guardian_approvals(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_refund_tx ON refund_records(transaction_id);
CREATE INDEX IF NOT EXISTS idx_saved_cards_merchant ON saved_cards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_saved_cards_token ON saved_cards(token);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_merchant ON bank_accounts(merchant_id);
