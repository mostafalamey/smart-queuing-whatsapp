import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as bcrypt from "bcryptjs";

/**
 * Kiosk Configuration Service
 * Handles local storage of kiosk configuration including:
 * - Organization/Branch/Department assignment
 * - Admin PIN for reconfiguration
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

// Config file location: %APPDATA%/smart-queue-kiosk/config.json
const getConfigDir = (): string => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "config");
};

const getConfigFilePath = (): string => {
  return path.join(getConfigDir(), "kiosk-config.json");
};

/**
 * Ensure config directory exists
 */
const ensureConfigDir = (): void => {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
};

/**
 * Check if kiosk is configured
 */
export const isConfigured = (): boolean => {
  const configPath = getConfigFilePath();
  if (!fs.existsSync(configPath)) {
    return false;
  }

  try {
    const config = loadConfig();
    // Validate required fields
    return !!(
      config &&
      config.organization_id &&
      config.department_id &&
      config.admin_pin_hash
    );
  } catch {
    return false;
  }
};

/**
 * Load configuration from disk
 */
export const loadConfig = (): KioskConfig | null => {
  const configPath = getConfigFilePath();

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(fileContent) as KioskConfig;
    return config;
  } catch (error) {
    console.error("Failed to load config:", error);
    return null;
  }
};

/**
 * Save configuration to disk
 * @param config - Configuration object (with plain PIN, will be hashed)
 * @param plainPin - Plain text PIN to hash and store
 */
export const saveConfig = async (
  config: Omit<KioskConfig, "admin_pin_hash"> & { admin_pin?: string },
  plainPin?: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    ensureConfigDir();

    // Hash the PIN if provided
    let pinHash = "";
    if (plainPin) {
      pinHash = await bcrypt.hash(plainPin, 10);
    } else if ("admin_pin_hash" in config) {
      // Keep existing hash if updating config without changing PIN
      pinHash = (config as KioskConfig).admin_pin_hash;
    }

    const configToSave: KioskConfig = {
      organization_id: config.organization_id,
      organization_name: config.organization_name,
      branch_id: config.branch_id,
      branch_name: config.branch_name,
      department_id: config.department_id,
      department_name: config.department_name,
      admin_pin_hash: pinHash,
      configured_at: config.configured_at || new Date().toISOString(),
      configured_by: config.configured_by,
    };

    const configPath = getConfigFilePath();
    fs.writeFileSync(
      configPath,
      JSON.stringify(configToSave, null, 2),
      "utf-8",
    );

    console.log("Config saved successfully to:", configPath);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to save config:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Clear configuration (factory reset)
 */
export const clearConfig = (): { success: boolean; error?: string } => {
  try {
    const configPath = getConfigFilePath();

    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

    console.log("Config cleared (factory reset)");
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to clear config:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Verify PIN against stored hash
 */
export const verifyPin = async (pin: string): Promise<boolean> => {
  const config = loadConfig();

  if (!config || !config.admin_pin_hash) {
    return false;
  }

  try {
    const isValid = await bcrypt.compare(pin, config.admin_pin_hash);
    return isValid;
  } catch (error) {
    console.error("PIN verification failed:", error);
    return false;
  }
};

/**
 * Update admin PIN
 */
export const updatePin = async (
  oldPin: string,
  newPin: string,
): Promise<{ success: boolean; error?: string }> => {
  // Verify old PIN first
  const isOldPinValid = await verifyPin(oldPin);

  if (!isOldPinValid) {
    return { success: false, error: "Current PIN is incorrect" };
  }

  // Validate new PIN (4-6 digits)
  if (!/^\d{4,6}$/.test(newPin)) {
    return { success: false, error: "New PIN must be 4-6 digits" };
  }

  const config = loadConfig();

  if (!config) {
    return { success: false, error: "No configuration found" };
  }

  // Save with new PIN
  return await saveConfig(config, newPin);
};

/**
 * Get config file path (for debugging)
 */
export const getConfigPath = (): string => {
  return getConfigFilePath();
};
