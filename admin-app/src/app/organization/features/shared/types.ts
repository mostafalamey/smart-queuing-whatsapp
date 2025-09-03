export interface Organization {
  id: string;
  name: string;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  primary_color: string;
  welcome_message: string | null;
  logo_url: string | null;
  country: string | null;
  country_code: string | null;
  whatsapp_business_number: string | null;
  qr_code_message_template: string | null;
  // UltraMessage Multi-Instance Support
  ultramsg_instance_id: string | null;
  ultramsg_token: string | null;
  ultramsg_base_url: string | null;
  whatsapp_instance_status:
    | "active"
    | "inactive"
    | "suspended"
    | "error"
    | "testing"
    | null;
  ultramsg_webhook_token: string | null;
  ultramsg_created_at: string | null;
  ultramsg_last_tested: string | null;
  ultramsg_last_error: string | null;
  daily_message_limit: number | null;
  daily_message_count: number | null;
  message_count_reset_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "manager" | "employee";
  organization_id: string;
  branch_id: string | null;
  department_ids: string[] | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  onboarding_completed?: boolean | null;
  onboarding_skipped?: boolean | null;
  onboarding_completed_at?: string | null;
  organizations?: Organization;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  branch_id: string;
  created_at: string;
  updated_at: string;
  branches?: {
    id: string;
    name: string;
  };
}

export interface OrganizationForm {
  name: string;
  contact_email: string;
  phone: string;
  website: string;
  address: string;
  primary_color: string;
  logo_url: string;
  country: string;
  country_code: string;
  whatsapp_business_number: string;
  // UltraMessage Configuration
  ultramsg_instance_id: string;
  ultramsg_token: string;
  ultramsg_base_url: string;
  daily_message_limit: string;
  welcome_message?: string; // Deprecated field for backward compatibility
}

export interface QRCodeData {
  [key: string]: string;
}

export interface UltraMessageConfig {
  instanceId: string;
  token: string;
  baseUrl: string;
  webhookToken: string;
  status: "active" | "inactive" | "suspended" | "error" | "testing";
  lastTested?: string;
  lastError?: string;
  dailyLimit: number;
  dailyCount: number;
}

export interface UltraMessageTestResult {
  success: boolean;
  message: string;
  details?: any;
  responseTime?: number;
}
