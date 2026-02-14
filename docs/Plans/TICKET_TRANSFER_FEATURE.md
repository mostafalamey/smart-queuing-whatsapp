# Ticket Transfer Feature Implementation Plan

**Status:** ✅ Complete  
**Created:** February 14, 2026  
**Last Updated:** February 14, 2026

---

## Overview

Add the ability to transfer tickets between services across departments during active service. When a doctor/employee is serving a patient, they can transfer the ticket to another service (e.g., Emergency Cardiac → Cardiology ECG). The transfer records service time in the original queue, resets the ticket to `waiting` in the destination queue, and tracks the outcome as `transferred` for analytics.

---

## Implementation Phases

### Phase 1: Database Schema ✅

- [x] Create `ticket_transfers` audit table
- [x] Add `original_ticket_number` and `original_service_id` columns to `tickets`
- [x] Add `service_outcome` column (completed, cancelled, transferred, skipped)
- [x] Create `transfer_ticket` RPC function
- [x] Add RLS policies
- [x] Create `get_ticket_transfer_history` helper function

### Phase 2: TypeScript Types ✅

- [x] Add `TicketTransfer` interface
- [x] Update `Ticket` type with transfer fields
- [x] Update `TicketStatus` union type

### Phase 3: Transfer Hook ✅

- [x] Create `useTransferTicket` hook
- [x] Fetch available transfer destinations
- [x] Call `transfer_ticket` RPC
- [x] Handle success/error states

### Phase 4: UI Components ✅

- [x] Create `TransferTicketModal` component
- [x] Add Transfer button to `QueueStatus`
- [x] Update dashboard page integration

### Phase 5: WhatsApp Notifications ✅

- [x] Add `ticketTransferred` message template
- [x] Send notification after transfer

### Phase 6: Permissions & Polish ✅

- [x] Add `canTransferTicket` permission
- [x] Update role permissions (admin, manager, employee all can transfer)
- [x] Expose permission through useDashboardData hook

---

## Detailed Steps

### Phase 1: Database Schema

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_ticket_transfer_feature.sql`

**Changes:**

1. Create `ticket_transfers` audit table:
   - `id` UUID PRIMARY KEY
   - `ticket_id` UUID REFERENCES tickets(id)
   - `from_service_id` UUID REFERENCES services(id)
   - `from_department_id` UUID REFERENCES departments(id)
   - `to_service_id` UUID REFERENCES services(id)
   - `to_department_id` UUID REFERENCES departments(id)
   - `transferred_by` UUID REFERENCES members(id)
   - `transfer_reason` TEXT
   - `service_duration` INTERVAL
   - `transferred_at` TIMESTAMPTZ DEFAULT NOW()

2. Add columns to `tickets`:
   - `original_ticket_number` TEXT
   - `original_service_id` UUID
   - `service_outcome` TEXT (completed, cancelled, transferred)

3. Create `transfer_ticket` RPC function:
   - Validate ticket status is `serving` or `waiting`
   - Validate target service exists in same organization
   - Calculate service duration
   - Insert audit record
   - Update ticket service/department/status
   - Clear `called_at` and source queue_settings

### Phase 2: TypeScript Types

**Files:**

- `admin-app/src/types/database.ts`
- `types.ts`

**Changes:**

1. Add `TicketTransfer` interface
2. Update `Ticket` type with `original_ticket_number`, `original_service_id`, `service_outcome`
3. Add `'transferred'` to status types where applicable

### Phase 3: Transfer Hook

**Files:**

- `admin-app/src/app/dashboard/features/queue-controls/useTransferTicket.ts`
- `admin-app/src/app/dashboard/features/queue-controls/index.ts`

**Changes:**

1. Create hook that:
   - Fetches all services in organization grouped by department/branch
   - Provides `transferTicket(ticketId, targetServiceId, reason)` function
   - Handles loading/error states
   - Triggers queue refresh after transfer

### Phase 4: UI Components

**Files:**

- `admin-app/src/components/TransferTicketModal.tsx`
- `admin-app/src/app/dashboard/features/queue-status/QueueStatus.tsx`
- `admin-app/src/app/dashboard/features/shared/useDashboardData.ts`

**Changes:**

1. Create modal with:
   - Department → Service two-level selector
   - Queue length per destination
   - Optional reason field
   - Confirmation step

2. Add Transfer button to QueueStatus:
   - Show when ticket is `serving`
   - Use `ArrowRightLeft` icon
   - Open modal on click

3. Update useDashboardData:
   - Add `transferDestinations` state
   - Fetch all services with queue counts

### Phase 5: WhatsApp Notifications

**Files:**

- `shared/message-templates.ts`
- `admin-app/src/lib/whatsapp-notification-service.ts`

**Changes:**

1. Add `ticketTransferred` template:

   ```text
   Your ticket {{ticketNumber}} has been transferred to {{serviceName}} at {{departmentName}}.
   You are now #{{position}} in the queue. We'll notify you when it's your turn.
   ```

2. Call notification service after successful transfer

### Phase 6: Permissions & Polish

**Files:**

- `admin-app/src/hooks/useRolePermissions.ts`
- `admin-app/src/lib/roleUtils.ts`

**Changes:**

1. Add `canTransferTicket` to `RolePermissions`
2. Admin/Manager: transfer to any service
3. Employee: transfer within assigned branch only
4. Ensure real-time updates work across departments

---

## Decisions

| Decision             | Choice                                 | Rationale                                                |
| -------------------- | -------------------------------------- | -------------------------------------------------------- |
| Allowed status       | `serving` primary, `waiting` secondary | Healthcare workflow: doctor transfers during examination |
| Post-transfer status | Reset to `waiting`                     | Patient re-enters destination queue                      |
| Queue position       | End of destination queue               | Fairness to existing waiters                             |
| Ticket numbering     | Keep original number                   | Customer familiarity                                     |
| Service time         | Track duration in audit                | Analytics for efficiency                                 |
| Audit approach       | Separate `ticket_transfers` table      | Clean schema, full history                               |
| Transfer scope       | Any service in organization            | Flexibility for healthcare routing                       |
| Transfer reason      | Optional                               | Encouraged but not required                              |

---

## Verification Checklist

- [ ] Create ticket in Department A, Service X
- [ ] Call ticket (status → `serving`)
- [ ] Click Transfer, select Department B / Service Y
- [ ] Verify original queue shows "No one being served"
- [ ] Verify ticket in new queue with `waiting` status
- [ ] Verify ticket number preserved
- [ ] Verify WhatsApp notification sent
- [ ] Verify `ticket_transfers` record created
- [ ] Test employee permission restrictions
- [ ] Test transfer of `waiting` ticket
- [ ] Test invalid transfers (same service, completed ticket)

---

## Progress Log

| Date       | Phase    | Status      | Notes                                                           |
| ---------- | -------- | ----------- | --------------------------------------------------------------- |
| 2026-02-14 | Planning | ✅ Complete | Plan created                                                    |
| 2026-02-14 | Phase 1  | ✅ Complete | Migration created: `20260214120000_ticket_transfer_feature.sql` |
| 2026-02-14 | Phase 2  | ✅ Complete | Types added to `database.ts` and `types.ts`                     |
| 2026-02-14 | Phase 3  | ✅ Complete | `useTransferTicket` hook created with WhatsApp integration      |
| 2026-02-14 | Phase 4  | ✅ Complete | `TransferTicketModal` component, Transfer button in QueueStatus |
| 2026-02-14 | Phase 5  | ✅ Complete | `ticketTransferred` message template added                      |
| 2026-02-14 | Phase 6  | ✅ Complete | `canTransferTicket` permission added for all roles              |
