import { contextBridge, ipcRenderer } from "electron";

/**
 * Preload script - exposes safe IPC methods to the renderer process
 * via contextBridge for security (contextIsolation: true)
 */

// Type definitions for exposed API
export interface ElectronAPI {
  // Config methods
  config: {
    isConfigured: () => Promise<boolean>;
    load: () => Promise<KioskConfig | null>;
    save: (
      config: KioskConfigInput,
      pin?: string,
    ) => Promise<{ success: boolean; error?: string }>;
    clear: () => Promise<{ success: boolean }>;
  };

  // PIN methods
  pin: {
    verify: (pin: string) => Promise<boolean>;
    update: (
      oldPin: string,
      newPin: string,
    ) => Promise<{ success: boolean; error?: string }>;
  };

  // Printer methods
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

  // App info
  app: {
    getVersion: () => Promise<string>;
    isPackaged: () => Promise<boolean>;
  };
}

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
}

export interface TicketData {
  ticket_number: string;
  service_name: string;
  position: number;
  estimated_wait: string;
  created_at: string;
  organization_name: string;
  qr_code_url?: string;
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Config methods
  config: {
    isConfigured: () => ipcRenderer.invoke("config:isConfigured"),
    load: () => ipcRenderer.invoke("config:load"),
    save: (config: KioskConfigInput, pin?: string) =>
      ipcRenderer.invoke("config:save", { config, pin }),
    clear: () => ipcRenderer.invoke("config:clear"),
  },

  // PIN methods
  pin: {
    verify: (pin: string) => ipcRenderer.invoke("pin:verify", pin),
    update: (oldPin: string, newPin: string) =>
      ipcRenderer.invoke("pin:update", oldPin, newPin),
  },

  // Printer methods
  printer: {
    status: () => ipcRenderer.invoke("printer:status"),
    print: (ticketData: TicketData) =>
      ipcRenderer.invoke("printer:print", ticketData),
    test: () => ipcRenderer.invoke("printer:test"),
    list: () => ipcRenderer.invoke("printer:list"),
  },

  // App info
  app: {
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
    isPackaged: () => ipcRenderer.invoke("app:isPackaged"),
  },
} as ElectronAPI);

// Log that preload script has loaded (dev only)
console.log("Electron preload script loaded");
