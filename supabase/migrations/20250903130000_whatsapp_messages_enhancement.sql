-- Migration: Remove welcome_message from organizations and enhance message_templates
-- Date: 2025-09-03
-- Description: Transition to WhatsApp-first messaging system

-- Step 1: Remove welcome_message column from organizations table
ALTER TABLE organizations 
DROP COLUMN IF EXISTS welcome_message;

-- Step 2: Add comment to qr_code_message_template column for clarity
COMMENT ON COLUMN organizations.qr_code_message_template IS 'QR code message template for WhatsApp deep links';

-- Step 3: Update message_templates structure to support WhatsApp conversation flow
-- First, create a backup of existing templates
CREATE TABLE IF NOT EXISTS message_templates_backup AS 
SELECT * FROM message_templates WHERE false;

-- Insert backup of current data
INSERT INTO message_templates_backup 
SELECT * FROM message_templates;

-- Update the message_templates table structure
-- The templates column already exists as JSONB, so we just need to update the data

-- Step 4: Update existing template records to include new WhatsApp conversation templates
UPDATE message_templates 
SET templates = jsonb_set(
  COALESCE(templates, '{}'::jsonb),
  '{qrCodeMessage}',
  '"Hello {{organizationName}}! I would like to join the queue."'
)
WHERE organization_id IS NOT NULL;

UPDATE message_templates 
SET templates = jsonb_set(
  templates,
  '{welcomeMessage}',
  '"🏢 Welcome to {{organizationName}}!\n\nThank you for choosing our services. Let''s get you set up in our queue system.\n\n📍 We''ll help you select the right service and get your queue position."'
)
WHERE organization_id IS NOT NULL;

UPDATE message_templates 
SET templates = jsonb_set(
  templates,
  '{branchSelection}',
  '"🏢 Welcome to {{organizationName}}!\n\n📍 *Select Your Branch:*\n\n{{branchList}}\n\n💬 Reply with the number of your desired branch."'
)
WHERE organization_id IS NOT NULL;

UPDATE message_templates 
SET templates = jsonb_set(
  templates,
  '{departmentSelection}',
  '"🏢 {{branchName}}\n\n🏬 *Select Your Department:*\n\n{{departmentList}}\n\n💬 Reply with the number of your desired department."'
)
WHERE organization_id IS NOT NULL;

UPDATE message_templates 
SET templates = jsonb_set(
  templates,
  '{serviceSelection}',
  '"🏢 Welcome to our queue system!\n\n📋 *Available Services:*\n\n{{serviceList}}\n\n💬 Reply with the number of your desired service."'
)
WHERE organization_id IS NOT NULL;

UPDATE message_templates 
SET templates = jsonb_set(
  templates,
  '{ticketConfirmation}',
  '"✅ *Ticket Confirmed!*\n\n🎟️ *Ticket:* {{ticketNumber}}\n🏬 *Location:* {{branchName}} - {{departmentName}}\n🔧 *Service:* {{serviceName}}\n👥 *Position in Queue:* {{queuePosition}}\n⏱️ *Estimated Wait:* {{estimatedWaitTime}}\n\n📱 You''ll receive automatic updates as your turn approaches!\n\n💡 Reply ''status'' to check your current position anytime."'
)
WHERE organization_id IS NOT NULL;

UPDATE message_templates 
SET templates = jsonb_set(
  templates,
  '{statusUpdate}',
  '"🔔 *Queue Status Update*\n\n🎟️ *Ticket:* {{ticketNumber}}\n👥 *Current Position:* {{queuePosition}} of {{totalInQueue}}\n⏱️ *Estimated Wait:* {{estimatedWaitTime}}\n🔧 *Currently Serving:* {{currentlyServing}}\n\nAlmost your turn! Please be ready."'
)
WHERE organization_id IS NOT NULL;

UPDATE message_templates 
SET templates = jsonb_set(
  templates,
  '{invalidInput}',
  '"❌ *Invalid Selection*\n\nPlease reply with a valid number from the options provided.\n\nType ''restart'' to begin again or ''help'' for assistance."'
)
WHERE organization_id IS NOT NULL;

UPDATE message_templates 
SET templates = jsonb_set(
  templates,
  '{systemError}',
  '"⚠️ *System Error*\n\nWe''re experiencing technical difficulties. Please try again in a moment.\n\nIf the problem persists, please contact our staff directly."'
)
WHERE organization_id IS NOT NULL;

-- Step 5: For organizations that don't have message_templates yet, create default ones
INSERT INTO message_templates (organization_id, templates, created_at, updated_at)
SELECT 
  o.id,
  '{
    "qrCodeMessage": "Hello {{organizationName}}! I would like to join the queue.",
    "welcomeMessage": "🏢 Welcome to {{organizationName}}!\\n\\nThank you for choosing our services. Let''s get you set up in our queue system.\\n\\n📍 We''ll help you select the right service and get your queue position.",
    "branchSelection": "🏢 Welcome to {{organizationName}}!\\n\\n📍 *Select Your Branch:*\\n\\n{{branchList}}\\n\\n💬 Reply with the number of your desired branch.",
    "departmentSelection": "🏢 {{branchName}}\\n\\n🏬 *Select Your Department:*\\n\\n{{departmentList}}\\n\\n💬 Reply with the number of your desired department.",
    "serviceSelection": "🏢 Welcome to our queue system!\\n\\n📋 *Available Services:*\\n\\n{{serviceList}}\\n\\n💬 Reply with the number of your desired service.",
    "ticketConfirmation": "✅ *Ticket Confirmed!*\\n\\n🎟️ *Ticket:* {{ticketNumber}}\\n🏬 *Location:* {{branchName}} - {{departmentName}}\\n🔧 *Service:* {{serviceName}}\\n👥 *Position in Queue:* {{queuePosition}}\\n⏱️ *Estimated Wait:* {{estimatedWaitTime}}\\n\\n📱 You''ll receive automatic updates as your turn approaches!\\n\\n💡 Reply ''status'' to check your current position anytime.",
    "statusUpdate": "🔔 *Queue Status Update*\\n\\n🎟️ *Ticket:* {{ticketNumber}}\\n👥 *Current Position:* {{queuePosition}} of {{totalInQueue}}\\n⏱️ *Estimated Wait:* {{estimatedWaitTime}}\\n🔧 *Currently Serving:* {{currentlyServing}}\\n\\nAlmost your turn! Please be ready.",
    "invalidInput": "❌ *Invalid Selection*\\n\\nPlease reply with a valid number from the options provided.\\n\\nType ''restart'' to begin again or ''help'' for assistance.",
    "systemError": "⚠️ *System Error*\\n\\nWe''re experiencing technical difficulties. Please try again in a moment.\\n\\nIf the problem persists, please contact our staff directly.",
    "ticketCreated": {
      "whatsapp": "🎉 *Welcome to {{organizationName}}!*\\n\\n📋 *Ticket: {{ticketNumber}}*\\n🏢 Department: {{departmentName}}\\n🔧 Service: {{serviceName}}\\n\\n📊 *Queue Status:*\\n• Position: {{queuePosition}} of {{totalInQueue}}\\n• Estimated wait: {{estimatedWaitTime}}\\n• Currently serving: {{currentlyServing}}\\n\\nWe''ll notify you when it''s your turn. Thank you for choosing us! ✨",
      "push": {
        "title": "🎉 Ticket Created - {{organizationName}}",
        "body": "Ticket {{ticketNumber}} for {{serviceName}}. Position {{queuePosition}} of {{totalInQueue}}. Est. wait: {{estimatedWaitTime}}"
      }
    },
    "youAreNext": {
      "whatsapp": "🔔 *You''re Next!*\\n\\n📋 *Ticket: {{ticketNumber}}*\\n🏢 {{organizationName}} - {{departmentName}}\\n🔧 {{serviceName}}\\n\\n⏰ Please be ready! You''ll be called shortly.\\n\\nCurrently serving: {{currentlyServing}}",
      "push": {
        "title": "🔔 You''re Next! - {{organizationName}}",
        "body": "Ticket {{ticketNumber}} for {{serviceName}}. Please be ready!"
      }
    },
    "yourTurn": {
      "whatsapp": "🎯 *Your Turn Now!*\\n\\n📋 *Ticket: {{ticketNumber}}*\\n🏢 {{organizationName}} - {{departmentName}}\\n🔧 {{serviceName}}\\n\\n👆 Please proceed to the service counter immediately.\\n\\nThank you for waiting! 🙏",
      "push": {
        "title": "🎯 Your Turn! - {{organizationName}}",
        "body": "Ticket {{ticketNumber}} - Please proceed to {{departmentName}} counter now!"
      }
    }
  }'::jsonb,
  NOW(),
  NOW()
FROM organizations o
LEFT JOIN message_templates mt ON o.id = mt.organization_id
WHERE mt.organization_id IS NULL;

-- Step 6: Update existing organizations to set a default QR code message if null
UPDATE organizations 
SET qr_code_message_template = 'Hello {{organizationName}}! I would like to join the queue.'
WHERE qr_code_message_template IS NULL OR qr_code_message_template = '';

-- Step 7: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_templates_org_id ON message_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_whatsapp_number ON organizations(whatsapp_business_number);

-- Step 8: Update table comments
COMMENT ON TABLE message_templates IS 'WhatsApp conversation and notification message templates for each organization';
COMMENT ON COLUMN message_templates.templates IS 'JSONB object containing all WhatsApp conversation flow templates';
