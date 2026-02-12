-- Migration: Add UltraMessage instance management to organizations
-- File: 20250903150000_ultramsg_multi_instance_support.sql
-- Date: September 3, 2025

-- Add UltraMessage instance management columns to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS ultramsg_instance_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS ultramsg_token VARCHAR(255), -- Will be encrypted
ADD COLUMN IF NOT EXISTS ultramsg_base_url VARCHAR(255) DEFAULT 'https://api.ultramsg.com',
ADD COLUMN IF NOT EXISTS whatsapp_instance_status VARCHAR(20) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS ultramsg_webhook_token VARCHAR(255), -- Instance-specific webhook token
ADD COLUMN IF NOT EXISTS ultramsg_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ultramsg_last_tested TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ultramsg_last_error TEXT,
ADD COLUMN IF NOT EXISTS daily_message_limit INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS daily_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS message_count_reset_date DATE DEFAULT CURRENT_DATE;

-- Add check constraint for instance status
ALTER TABLE organizations
ADD CONSTRAINT chk_whatsapp_instance_status 
CHECK (whatsapp_instance_status IN ('active', 'inactive', 'suspended', 'error', 'testing'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_ultramsg_instance ON organizations(ultramsg_instance_id);
CREATE INDEX IF NOT EXISTS idx_organizations_whatsapp_status ON organizations(whatsapp_instance_status);
CREATE INDEX IF NOT EXISTS idx_organizations_whatsapp_number ON organizations(whatsapp_business_number);

-- Add comments for documentation
COMMENT ON COLUMN organizations.ultramsg_instance_id IS 'UltraMessage instance ID for this organization';
COMMENT ON COLUMN organizations.ultramsg_token IS 'Encrypted UltraMessage API token for this organization';
COMMENT ON COLUMN organizations.ultramsg_base_url IS 'UltraMessage API base URL (usually https://api.ultramsg.com)';
COMMENT ON COLUMN organizations.whatsapp_instance_status IS 'Status of the WhatsApp instance: active, inactive, suspended, error, testing';
COMMENT ON COLUMN organizations.ultramsg_webhook_token IS 'Unique webhook token for this organization instance';
COMMENT ON COLUMN organizations.ultramsg_created_at IS 'When the UltraMessage instance was first configured';
COMMENT ON COLUMN organizations.ultramsg_last_tested IS 'Last successful connection test timestamp';
COMMENT ON COLUMN organizations.ultramsg_last_error IS 'Last error message from UltraMessage API';
COMMENT ON COLUMN organizations.daily_message_limit IS 'Daily message sending limit for this instance';
COMMENT ON COLUMN organizations.daily_message_count IS 'Current daily message count';
COMMENT ON COLUMN organizations.message_count_reset_date IS 'Date when daily count was last reset';

-- Function to reset daily message counts (run daily via cron)
CREATE OR REPLACE FUNCTION reset_daily_message_counts()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    UPDATE organizations
    SET 
        daily_message_count = 0,
        message_count_reset_date = CURRENT_DATE
    WHERE message_count_reset_date < CURRENT_DATE;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to increment message count for an organization
CREATE OR REPLACE FUNCTION increment_message_count(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    daily_limit INTEGER;
BEGIN
    -- Reset count if date has changed
    UPDATE organizations
    SET 
        daily_message_count = 0,
        message_count_reset_date = CURRENT_DATE
    WHERE id = org_id AND message_count_reset_date < CURRENT_DATE;
    
    -- Get current count and limit
    SELECT daily_message_count, daily_message_limit 
    INTO current_count, daily_limit
    FROM organizations 
    WHERE id = org_id;
    
    -- Check if limit exceeded
    IF current_count >= daily_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Increment count
    UPDATE organizations
    SET daily_message_count = daily_message_count + 1
    WHERE id = org_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate UltraMessage configuration
CREATE OR REPLACE FUNCTION validate_ultramsg_config(
    instance_id VARCHAR,
    token VARCHAR,
    base_url VARCHAR
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Basic validation
    IF instance_id IS NULL OR LENGTH(instance_id) = 0 THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Instance ID is required');
    END IF;
    
    IF token IS NULL OR LENGTH(token) = 0 THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Token is required');
    END IF;
    
    IF base_url IS NULL OR base_url NOT LIKE 'https://%' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Base URL must be a valid HTTPS URL');
    END IF;
    
    -- Instance ID format validation (should start with "instance")
    IF instance_id NOT LIKE 'instance%' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Instance ID should start with "instance"');
    END IF;
    
    RETURN jsonb_build_object('valid', true, 'message', 'Configuration appears valid');
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Organizations can only access their own UltraMessage config
CREATE POLICY "Organizations can manage their own UltraMessage config"
ON organizations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM members 
        WHERE members.organization_id = organizations.id 
        AND members.auth_user_id = auth.uid()
        AND members.role IN ('admin', 'manager')
        AND members.is_active = true
    )
);

-- Update existing organizations to have inactive status initially
UPDATE organizations
SET 
    whatsapp_instance_status = 'inactive',
    ultramsg_base_url = 'https://api.ultramsg.com'
WHERE whatsapp_instance_status IS NULL;

-- Example: Update your existing organization with current UltraMessage config
-- (Run this manually with your actual organization ID)
/*
UPDATE organizations
SET 
    ultramsg_instance_id = 'instance140392',
    ultramsg_token = 'your-encrypted-token-here',
    whatsapp_instance_status = 'active',
    ultramsg_created_at = NOW(),
    ultramsg_last_tested = NOW(),
    daily_message_limit = 1000
WHERE id = 'your-organization-id';
*/
