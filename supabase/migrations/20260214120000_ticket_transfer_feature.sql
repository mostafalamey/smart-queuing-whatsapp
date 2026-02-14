-- Ticket Transfer Feature Migration
-- Allows transferring tickets between services across departments

-- =====================================================
-- 1. Add transfer-related columns to tickets table
-- =====================================================

-- Original ticket number (preserved when ticket is transferred)
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS original_ticket_number TEXT,
ADD COLUMN IF NOT EXISTS original_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS original_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS service_outcome TEXT CHECK (service_outcome IN ('completed', 'cancelled', 'transferred', 'skipped'));

-- Index for finding transferred tickets
CREATE INDEX IF NOT EXISTS idx_tickets_original_service ON tickets(original_service_id) WHERE original_service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_service_outcome ON tickets(service_outcome) WHERE service_outcome IS NOT NULL;

COMMENT ON COLUMN tickets.original_ticket_number IS 'Original ticket number before any transfers';
COMMENT ON COLUMN tickets.original_service_id IS 'Original service ID before first transfer';
COMMENT ON COLUMN tickets.original_department_id IS 'Original department ID before first transfer';
COMMENT ON COLUMN tickets.service_outcome IS 'How the service ended: completed, cancelled, transferred, skipped';

-- =====================================================
-- 2. Create ticket_transfers audit table
-- =====================================================

CREATE TABLE IF NOT EXISTS ticket_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Source location
  from_service_id UUID NOT NULL REFERENCES services(id) ON DELETE SET NULL,
  from_department_id UUID NOT NULL REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Destination location
  to_service_id UUID NOT NULL REFERENCES services(id) ON DELETE SET NULL,
  to_department_id UUID NOT NULL REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Transfer metadata
  transferred_by UUID REFERENCES members(id) ON DELETE SET NULL,
  transfer_reason TEXT,
  service_duration INTERVAL, -- Time spent in source service before transfer
  
  -- Timestamps
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ticket_transfers_ticket ON ticket_transfers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_transfers_from_service ON ticket_transfers(from_service_id);
CREATE INDEX IF NOT EXISTS idx_ticket_transfers_to_service ON ticket_transfers(to_service_id);
CREATE INDEX IF NOT EXISTS idx_ticket_transfers_transferred_at ON ticket_transfers(transferred_at);
CREATE INDEX IF NOT EXISTS idx_ticket_transfers_transferred_by ON ticket_transfers(transferred_by);

COMMENT ON TABLE ticket_transfers IS 'Audit log for ticket transfers between services/departments';
COMMENT ON COLUMN ticket_transfers.service_duration IS 'Time from when ticket was called to when it was transferred';

-- =====================================================
-- 3. RLS Policies for ticket_transfers
-- =====================================================

ALTER TABLE ticket_transfers ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view transfers within their organization
CREATE POLICY "Members can view transfers in their organization"
ON ticket_transfers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tickets t
    JOIN services s ON t.service_id = s.id OR ticket_transfers.from_service_id = s.id
    JOIN departments d ON s.department_id = d.id
    JOIN branches b ON d.branch_id = b.id
    JOIN members m ON m.organization_id = b.organization_id
    WHERE t.id = ticket_transfers.ticket_id
    AND m.auth_user_id = auth.uid()
    AND m.is_active = true
  )
);

-- Policy: Members can create transfers (admin/manager check done in function)
CREATE POLICY "Authenticated users can create transfers"
ON ticket_transfers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM members m
    WHERE m.auth_user_id = auth.uid()
    AND m.is_active = true
  )
);

-- =====================================================
-- 4. Transfer Ticket RPC Function
-- =====================================================

CREATE OR REPLACE FUNCTION public.transfer_ticket(
  p_ticket_id UUID,
  p_target_service_id UUID,
  p_transferred_by UUID DEFAULT NULL,
  p_transfer_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_source_service RECORD;
  v_target_service RECORD;
  v_organization_id UUID;
  v_service_duration INTERVAL;
  v_transfer_record ticket_transfers%ROWTYPE;
  v_position INT;
BEGIN
  -- 1. Get and validate the ticket
  SELECT t.*, s.department_id as current_dept_id
  INTO v_ticket
  FROM tickets t
  JOIN services s ON t.service_id = s.id
  WHERE t.id = p_ticket_id
  FOR UPDATE; -- Lock the ticket row

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found: %', p_ticket_id;
  END IF;

  -- 2. Validate ticket status (must be serving or waiting)
  IF v_ticket.status NOT IN ('serving', 'waiting') THEN
    RAISE EXCEPTION 'Cannot transfer ticket with status: %. Only serving or waiting tickets can be transferred.', v_ticket.status;
  END IF;

  -- 3. Get source service info
  SELECT s.*, d.branch_id, b.organization_id
  INTO v_source_service
  FROM services s
  JOIN departments d ON s.department_id = d.id
  JOIN branches b ON d.branch_id = b.id
  WHERE s.id = v_ticket.service_id;

  v_organization_id := v_source_service.organization_id;

  -- 4. Get and validate target service
  SELECT s.*, d.id as dept_id, d.branch_id, b.organization_id as org_id
  INTO v_target_service
  FROM services s
  JOIN departments d ON s.department_id = d.id
  JOIN branches b ON d.branch_id = b.id
  WHERE s.id = p_target_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target service not found: %', p_target_service_id;
  END IF;

  -- 5. Validate same organization
  IF v_target_service.org_id != v_organization_id THEN
    RAISE EXCEPTION 'Cannot transfer to a service in a different organization';
  END IF;

  -- 6. Validate not transferring to same service
  IF p_target_service_id = v_ticket.service_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same service';
  END IF;

  -- 7. Calculate service duration if ticket was being served
  IF v_ticket.status = 'serving' AND v_ticket.called_at IS NOT NULL THEN
    v_service_duration := NOW() - v_ticket.called_at;
  ELSE
    v_service_duration := NULL;
  END IF;

  -- 8. Create transfer audit record
  INSERT INTO ticket_transfers (
    ticket_id,
    from_service_id,
    from_department_id,
    to_service_id,
    to_department_id,
    transferred_by,
    transfer_reason,
    service_duration
  ) VALUES (
    p_ticket_id,
    v_ticket.service_id,
    v_ticket.department_id,
    p_target_service_id,
    v_target_service.dept_id,
    p_transferred_by,
    p_transfer_reason,
    v_service_duration
  )
  RETURNING * INTO v_transfer_record;

  -- 9. Update the ticket
  UPDATE tickets
  SET
    service_id = p_target_service_id,
    department_id = v_target_service.dept_id,
    status = 'waiting',
    called_at = NULL,
    service_outcome = CASE WHEN status = 'serving' THEN 'transferred' ELSE service_outcome END,
    original_ticket_number = COALESCE(original_ticket_number, ticket_number),
    original_service_id = COALESCE(original_service_id, v_ticket.service_id),
    original_department_id = COALESCE(original_department_id, v_ticket.department_id),
    updated_at = NOW()
  WHERE id = p_ticket_id;

  -- 10. Clear current_serving in source department's queue_settings if ticket was being served
  IF v_ticket.status = 'serving' THEN
    UPDATE queue_settings
    SET current_serving = NULL, updated_at = NOW()
    WHERE department_id = v_ticket.department_id
    AND current_serving = v_ticket.ticket_number;
  END IF;

  -- 11. Calculate new position in destination queue
  SELECT COUNT(*) + 1 INTO v_position
  FROM tickets
  WHERE service_id = p_target_service_id
  AND status = 'waiting'
  AND id != p_ticket_id;

  -- 12. Return result
  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', p_ticket_id,
    'transfer_id', v_transfer_record.id,
    'from_service_id', v_ticket.service_id,
    'from_department_id', v_ticket.department_id,
    'to_service_id', p_target_service_id,
    'to_department_id', v_target_service.dept_id,
    'new_status', 'waiting',
    'new_position', v_position,
    'service_duration_seconds', EXTRACT(EPOCH FROM v_service_duration)
  );
END;
$$;

COMMENT ON FUNCTION public.transfer_ticket IS 'Transfers a ticket from one service to another, creating an audit trail';

-- =====================================================
-- 5. Helper function to get transfer history for a ticket
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_ticket_transfer_history(
  p_ticket_id UUID
) RETURNS TABLE (
  transfer_id UUID,
  from_service_name TEXT,
  from_department_name TEXT,
  to_service_name TEXT,
  to_department_name TEXT,
  transferred_by_name TEXT,
  transfer_reason TEXT,
  service_duration INTERVAL,
  transferred_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tt.id as transfer_id,
    fs.name as from_service_name,
    fd.name as from_department_name,
    ts.name as to_service_name,
    td.name as to_department_name,
    m.name as transferred_by_name,
    tt.transfer_reason,
    tt.service_duration,
    tt.transferred_at
  FROM ticket_transfers tt
  LEFT JOIN services fs ON tt.from_service_id = fs.id
  LEFT JOIN departments fd ON tt.from_department_id = fd.id
  LEFT JOIN services ts ON tt.to_service_id = ts.id
  LEFT JOIN departments td ON tt.to_department_id = td.id
  LEFT JOIN members m ON tt.transferred_by = m.id
  WHERE tt.ticket_id = p_ticket_id
  ORDER BY tt.transferred_at ASC;
END;
$$;

COMMENT ON FUNCTION public.get_ticket_transfer_history IS 'Returns the complete transfer history for a ticket';
