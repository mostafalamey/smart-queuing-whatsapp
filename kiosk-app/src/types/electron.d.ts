/**
 * TypeScript definitions for Electron API exposed via preload script
 */

export interface KioskConfig {
  organization_id: string;
  organization_name: string;
  branch_id: string;
  branch_name: string;
  department_id: string;
  department_name: string;
  admin_pin_hash: string;
  configured_at: string;
  configured_by: string;
}

// Input type for saving config (without the hash, PIN provided separately)
export interface KioskConfigInput {
  organization_id: string;
  organization_name: string;
  branch_id: string;
  branch_name: string;
  department_id: string;
  department_name: string;
  configured_at?: string;
  configured_by: string;
}

export interface PrinterStatus {
  connected: boolean;
  status: string;
  paperLow?: boolean;
  debugLog?: string[]; // Debug info from main process
}

export interface TicketData {
  ticket_number: string;
  service_name: string;
  position: number;
  estimated_wait: string;
  created_at: string;
  organization_name: string;
  branch_name?: string;
  department_name?: string;
  qr_code_url?: string;
  customer_phone?: string;
}

export interface ElectronAPI {
  config: {
    isConfigured: () => Promise<boolean>;
    load: () => Promise<KioskConfig | null>;
    save: (
      config: KioskConfigInput,
      pin?: string,
    ) => Promise<{ success: boolean; error?: string }>;
    clear: () => Promise<{ success: boolean }>;
  };

  pin: {
    verify: (pin: string) => Promise<boolean>;
    update: (
      oldPin: string,
      newPin: string,
    ) => Promise<{ success: boolean; error?: string }>;
  };

  printer: {
    status: () => Promise<PrinterStatus>;
    print: (
      ticketData: TicketData,
    ) => Promise<{ success: boolean; error?: string }>;
    test: () => Promise<{ success: boolean; error?: string }>;
    list: () => Promise<Array<{
      name: string;
      displayName: string;
      description: string;
    }>>;
  };

  app: {
    getVersion: () => Promise<string>;
    isPackaged: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
