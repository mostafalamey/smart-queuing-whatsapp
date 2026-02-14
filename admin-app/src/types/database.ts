export interface Organization {
  id: string;
  clerk_org_id: string | null;
  name: string;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  welcome_message: string | null;
  primary_color: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  branch_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  auth_user_id: string;
  email: string;
  name: string | null;
  role: string;
  organization_id: string;
  branch_id: string | null;
  department_ids: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  onboarding_completed?: boolean | null;
  onboarding_skipped?: boolean | null;
  onboarding_completed_at?: string | null;
}

export interface Ticket {
  id: string;
  ticket_number: number;
  customer_phone: string;
  status: string;
  priority: number;
  estimated_service_time: number | null;
  called_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  department_id: string;
  service_id?: string | null;
  // Transfer-related fields
  original_ticket_number?: string | null;
  original_service_id?: string | null;
  original_department_id?: string | null;
  service_outcome?: ServiceOutcome | null;
}

export type ServiceOutcome =
  | "completed"
  | "cancelled"
  | "transferred"
  | "no_show";

export interface TicketTransfer {
  id: string;
  ticket_id: string;
  from_service_id: string;
  from_department_id: string;
  to_service_id: string;
  to_department_id: string;
  transferred_by: string;
  transfer_reason: string | null;
  transfer_notes: string | null;
  service_duration_before_transfer: number | null;
  created_at: string;
}

export interface TransferTicketParams {
  p_ticket_id: string;
  p_target_service_id: string;
  p_transferred_by?: string;
  p_transfer_reason?: string;
}

export interface TransferTicketResult {
  success: boolean;
  ticket_id: string;
  transfer_id: string;
  from_service_id: string;
  from_department_id: string;
  to_service_id: string;
  to_department_id: string;
  new_status: string;
  new_position: number;
  service_duration_seconds: number | null;
}

export type UserRole = "admin" | "manager" | "employee";
export type TicketStatus =
  | "waiting"
  | "called"
  | "serving"
  | "completed"
  | "cancelled";
