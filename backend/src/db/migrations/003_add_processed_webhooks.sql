-- Migration 003: Add Processed Webhooks Table for Atomic Idempotency & Deduplication
-- 1. Creates processed_webhooks table to track inbound webhook deliveries.
-- 2. Prevents duplicate event processing via PRIMARY KEY constraint on id.
-- 3. Creates supporting indexes on resource_id, provider/event_type, and processed_at for fast reconciliation and audits.

CREATE TABLE IF NOT EXISTS processed_webhooks (
    id VARCHAR(128) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    resource_id VARCHAR(128),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance and deduplication indexes
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_resource_id ON processed_webhooks(resource_id);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_provider_event ON processed_webhooks(provider, event_type);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_processed_at ON processed_webhooks(processed_at);

