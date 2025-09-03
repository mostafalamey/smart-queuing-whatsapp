-- WhatsApp-First Customer Experience Database Schema
-- Migration for conversational WhatsApp queue management

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS whatsapp_conversations CASCADE;

-- WhatsApp Conversations Table
-- Manages multi-step conversations with customers
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  conversation_state VARCHAR(50) NOT NULL DEFAULT 'initial_contact',
  selected_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  context_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add WhatsApp conversation reference to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS created_via VARCHAR(20) DEFAULT 'app',
ADD COLUMN IF NOT EXISTS whatsapp_conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL;

-- Update services table to support WhatsApp features
ALTER TABLE services
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS estimated_service_time INTEGER DEFAULT 15, -- minutes
ADD COLUMN IF NOT EXISTS whatsapp_description TEXT;

-- Add QR code configuration to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS qr_code_message_template TEXT DEFAULT 'Hello! I would like to join the queue.',
ADD COLUMN IF NOT EXISTS whatsapp_business_number VARCHAR(20);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_org ON whatsapp_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_state ON whatsapp_conversations(conversation_state);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_ticket ON whatsapp_conversations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_service ON whatsapp_conversations(selected_service_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_via ON tickets(created_via);
CREATE INDEX IF NOT EXISTS idx_tickets_whatsapp_conversation ON tickets(whatsapp_conversation_id);

-- Enum type for conversation states
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_state_enum') THEN
        CREATE TYPE conversation_state_enum AS ENUM (
            'initial_contact',
            'awaiting_service_selection', 
            'awaiting_phone_number',
            'ticket_confirmed'
        );
    END IF;
END
$$;

-- Update conversation_state column to use enum (optional, for better type safety)
-- ALTER TABLE whatsapp_conversations 
-- ALTER COLUMN conversation_state TYPE conversation_state_enum 
-- USING conversation_state::conversation_state_enum;

-- Add helpful comments
COMMENT ON TABLE whatsapp_conversations IS 'Manages multi-step WhatsApp conversations for queue management';
COMMENT ON COLUMN whatsapp_conversations.conversation_state IS 'Current state of the conversation flow';
COMMENT ON COLUMN whatsapp_conversations.context_data IS 'Additional context data for the conversation (JSON)';
COMMENT ON COLUMN tickets.created_via IS 'How the ticket was created: app, whatsapp, kiosk';
COMMENT ON COLUMN tickets.whatsapp_conversation_id IS 'Reference to the WhatsApp conversation that created this ticket';
COMMENT ON COLUMN services.is_active IS 'Whether the service is currently available for new tickets';
COMMENT ON COLUMN services.estimated_service_time IS 'Average service time in minutes';
COMMENT ON COLUMN services.whatsapp_description IS 'Service description optimized for WhatsApp display';
COMMENT ON COLUMN organizations.qr_code_message_template IS 'Template message for QR code WhatsApp links';
COMMENT ON COLUMN organizations.whatsapp_business_number IS 'Organization WhatsApp Business number for QR codes';

-- Function to clean up old conversations (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_conversations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM whatsapp_conversations 
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND conversation_state IN ('ticket_confirmed', 'cancelled');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get queue position
CREATE OR REPLACE FUNCTION get_queue_position(p_ticket_id UUID, p_service_id UUID)
RETURNS INTEGER AS $$
DECLARE
    position INTEGER;
    ticket_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the created_at time of the ticket
    SELECT created_at INTO ticket_created_at
    FROM tickets
    WHERE id = p_ticket_id;
    
    -- Count tickets created before this one for the same service
    SELECT COUNT(*) + 1 INTO position
    FROM tickets
    WHERE service_id = p_service_id
    AND status IN ('waiting', 'called')
    AND created_at < ticket_created_at;
    
    RETURN position;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation state
CREATE OR REPLACE FUNCTION update_conversation_state(
    p_conversation_id UUID,
    p_new_state VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE whatsapp_conversations
    SET conversation_state = p_new_state,
        updated_at = NOW()
    WHERE id = p_conversation_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_updated_at
    BEFORE UPDATE ON whatsapp_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Sample data for testing (optional)
-- This will be populated by the admin when setting up organizations
INSERT INTO organizations (id, name, whatsapp_business_number, qr_code_message_template) 
VALUES (
    gen_random_uuid(),
    'WhatsApp Test Organization',
    '+966140392', -- Your UltraMessage number
    'Hello! I would like to join the queue for {{organization_name}}.'
) ON CONFLICT DO NOTHING;

-- Grant necessary permissions
-- Adjust based on your RLS policies
-- GRANT ALL ON whatsapp_conversations TO authenticated;
-- GRANT ALL ON whatsapp_conversations TO service_role;
