import { useState, useEffect, useCallback } from "react";
import type { KioskConfig, KioskConfigInput } from "../types/electron";

interface UseKioskConfigResult {
  isElectron: boolean;
  isConfigured: boolean | null;
  config: KioskConfig | null;
  loading: boolean;
  error: string | null;
  saveConfig: (
    config: KioskConfigInput,
    pin: string,
  ) => Promise<{ success: boolean; error?: string }>;
  clearConfig: () => Promise<{ success: boolean }>;
  refreshConfig: () => Promise<void>;
}

/**
 * Hook to manage kiosk configuration from Electron's config service
 * Falls back gracefully when not running in Electron
 */
export const useKioskConfig = (): UseKioskConfigResult => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if running in Electron
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  const refreshConfig = useCallback(async () => {
    if (!isElectron) {
      setLoading(false);
      setIsConfigured(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const configured = await window.electronAPI!.config.isConfigured();
      setIsConfigured(configured);

      if (configured) {
        const loadedConfig = await window.electronAPI!.config.load();
        setConfig(loadedConfig);
      } else {
        setConfig(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load configuration";
      setError(errorMessage);
      console.error("Config load error:", err);
    } finally {
      setLoading(false);
    }
  }, [isElectron]);

  // Load config on mount
  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const saveConfig = useCallback(
    async (
      configInput: KioskConfigInput,
      pin: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isElectron) {
        return { success: false, error: "Not running in Electron" };
      }

      try {
        const result = await window.electronAPI!.config.save(configInput, pin);

        if (result.success) {
          // Refresh config after save
          await refreshConfig();
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save configuration";
        return { success: false, error: errorMessage };
      }
    },
    [isElectron, refreshConfig],
  );

  const clearConfig = useCallback(async (): Promise<{ success: boolean }> => {
    if (!isElectron) {
      return { success: false };
    }

    try {
      const result = await window.electronAPI!.config.clear();

      if (result.success) {
        setConfig(null);
        setIsConfigured(false);
      }

      return result;
    } catch (err) {
      console.error("Config clear error:", err);
      return { success: false };
    }
  }, [isElectron]);

  return {
    isElectron,
    isConfigured,
    config,
    loading,
    error,
    saveConfig,
    clearConfig,
    refreshConfig,
  };
};

export default useKioskConfig;
