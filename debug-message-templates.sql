-- Check if message templates exist in the database
SELECT 
  organization_id,
  template_type,
  template_content,
  created_at
FROM message_templates 
ORDER BY organization_id, template_type;
