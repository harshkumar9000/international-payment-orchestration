-- ==============================================================================
-- International Payment Orchestration Platform
-- PostgreSQL & Supabase Compatible Schema
-- ==============================================================================

-- Enable UUID extension if PostgreSQL / Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    supported_currencies TEXT NOT NULL, -- JSON or comma-separated
    supported_methods TEXT NOT NULL,
    supported_countries TEXT NOT NULL,
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
    customer_amount NUMERIC(12, 2) NOT NULL,
    customer_currency VARCHAR(3) NOT NULL,
    exchange_rate NUMERIC(12, 6) DEFAULT 1.0,
    customer_email VARCHAR(255),
    customer_country VARCHAR(2) NOT NULL,
    payment_method VARCHAR(64) NOT NULL,
    primary_provider VARCHAR(64) NOT NULL,
    executed_provider VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL, -- 'settled', 'recovered', 'failed', 'blocked', 'pending_3ds', 'pending_upi'
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

-- Indexes for high-throughput FinTech queries
CREATE INDEX IF NOT EXISTS idx_tx_merchant_created ON transactions(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_currency ON transactions(currency);
CREATE INDEX IF NOT EXISTS idx_tx_provider ON transactions(executed_provider);
CREATE INDEX IF NOT EXISTS idx_routing_merchant ON routing_rules(merchant_id, priority_order ASC);

