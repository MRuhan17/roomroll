-- Migration: Compliance Tracking (GDPR, TOS, Privacy)

-- Add Legal acceptance columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Create Consent Preferences Table
CREATE TABLE IF NOT EXISTS consent_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    essential BOOLEAN NOT NULL DEFAULT TRUE,
    functional BOOLEAN NOT NULL DEFAULT FALSE,
    analytics BOOLEAN NOT NULL DEFAULT FALSE,
    marketing BOOLEAN NOT NULL DEFAULT FALSE,
    consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    consent_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
