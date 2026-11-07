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

-- Under-18 and Student Account Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
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

-- Parent / Guardian Approval Queue
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
    status VARCHAR(32) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'
    decision_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP WITH TIME ZONE
);

-- Agentic Refund Ledger (Idempotent & Audited)
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

-- Indexes for high-throughput FinTech queries
CREATE INDEX IF NOT EXISTS idx_tx_merchant_created ON transactions(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_currency ON transactions(currency);
CREATE INDEX IF NOT EXISTS idx_tx_provider ON transactions(executed_provider);
CREATE INDEX IF NOT EXISTS idx_routing_merchant ON routing_rules(merchant_id, priority_order ASC);
CREATE INDEX IF NOT EXISTS idx_student_email ON student_profiles(email);
CREATE INDEX IF NOT EXISTS idx_guardian_pending ON guardian_approvals(guardian_id, status);
CREATE INDEX IF NOT EXISTS idx_refund_tx ON refund_records(transaction_id);

