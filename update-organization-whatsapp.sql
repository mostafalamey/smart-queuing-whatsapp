-- Update organization with WhatsApp configuration
-- This should be run on your Supabase database

-- First, check current organizations
SELECT id, name, whatsapp_business_number FROM organizations LIMIT 5;

-- Update the organization with WhatsApp business number
-- Replace 'your-organization-id' with your actual organization ID
UPDATE organizations 
SET 
    whatsapp_business_number = '201015544028',
    qr_code_message_template = 'Hello! I would like to join the queue for {{organization_name}}.'
WHERE name LIKE '%' -- This will update all organizations, or specify exact name/ID

-- Verify the update
SELECT id, name, whatsapp_business_number, qr_code_message_template 
FROM organizations 
WHERE whatsapp_business_number IS NOT NULL;
