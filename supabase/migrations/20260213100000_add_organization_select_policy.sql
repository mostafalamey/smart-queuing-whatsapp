-- Add SELECT policy for all authenticated members (including employees) to read their organization
-- This allows employees to see organization name and logo in the UI

-- First drop the existing ALL policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Organizations can manage their own UltraMessage config" ON organizations;

-- Create separate policies for different operations

-- SELECT: All authenticated members can read their organization
CREATE POLICY "Members can view their organization"
ON organizations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM members 
        WHERE members.organization_id = organizations.id 
        AND members.auth_user_id = auth.uid()
        AND members.is_active = true
    )
);

-- INSERT/UPDATE/DELETE: Only admin and manager can modify
CREATE POLICY "Admins and managers can manage organization"
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
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM members 
        WHERE members.organization_id = organizations.id 
        AND members.auth_user_id = auth.uid()
        AND members.role IN ('admin', 'manager')
        AND members.is_active = true
    )
);
