import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Settings } from "lucide-react";
import KioskApp from "./KioskApp";
import { SetupWizard } from "./components/setup";
import { ReconfigureModal } from "./components/admin";
import { useKioskConfig } from "./hooks/useKioskConfig";
import type { KioskConfig } from "./types/electron";

/**
 * ElectronWrapper - Entry point for Electron kiosk mode
 * Handles:
 * - First-run setup wizard
 * - Configuration loading
 * - Reconfigure modal access (long-press on logo)
 */
const ElectronWrapper: React.FC = () => {
  const {
    isElectron,
    isConfigured,
    config,
    loading,
    error,
    saveConfig,
    clearConfig,
    refreshConfig,
  } = useKioskConfig();

  const [showReconfigureModal, setShowReconfigureModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Handle long-press start (for opening reconfigure modal)
  const handleLongPressStart = useCallback(() => {
    const timer = setTimeout(() => {
      setShowReconfigureModal(true);
    }, 3000); // 3 seconds
    setLongPressTimer(timer);
  }, []);

  // Handle long-press end
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Handle keyboard shortcut (Ctrl+Shift+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "K") {
        e.preventDefault();
        setShowReconfigureModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle setup complete
  const handleSetupComplete = useCallback(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Handle reconfigure - change department (go back to setup wizard)
  const handleChangeDepartment = useCallback(async () => {
    await clearConfig();
    refreshConfig();
  }, [clearConfig, refreshConfig]);

  // Handle factory reset
  const handleFactoryReset = useCallback(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Not running in Electron - render KioskApp directly with URL params
  if (!isElectron) {
    return <KioskApp />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading kiosk configuration...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-red-900 mb-2">
            Configuration Error
          </h1>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => refreshConfig()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Not configured - show setup wizard
  if (!isConfigured) {
    return (
      <SetupWizard onComplete={handleSetupComplete} saveConfig={saveConfig} />
    );
  }

  // Configured - render KioskApp with Electron config
  return (
    <>
      {/* Long-press overlay for reconfigure access */}
      <div
        className="fixed top-0 left-0 w-32 h-32 z-50 cursor-default"
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        style={{ opacity: 0 }}
        aria-hidden="true"
      />

      {/* Main Kiosk App */}
      <KioskAppWithConfig
        config={config!}
        onReconfigure={() => setShowReconfigureModal(true)}
      />

      {/* Reconfigure Modal */}
      <ReconfigureModal
        isOpen={showReconfigureModal}
        onClose={() => setShowReconfigureModal(false)}
        onChangeDepartment={handleChangeDepartment}
        onFactoryReset={handleFactoryReset}
        currentConfig={
          config
            ? {
                organizationName: config.organization_name,
                branchName: config.branch_name,
                departmentName: config.department_name,
              }
            : null
        }
      />
    </>
  );
};

/**
 * KioskApp wrapper that injects Electron config as props
 * This allows the KioskApp to work with both URL params (browser) and Electron config
 */
interface KioskAppWithConfigProps {
  config: KioskConfig;
  onReconfigure: () => void;
}

const KioskAppWithConfig: React.FC<KioskAppWithConfigProps> = ({
  config,
  onReconfigure,
}) => {
  // Inject config into URL params for KioskApp to consume
  // This is a bridge approach - KioskApp still reads from URL params
  useEffect(() => {
    // Update URL with config (without navigation)
    const url = new URL(window.location.href);
    url.searchParams.set("org", config.organization_id);
    url.searchParams.set("branch", config.branch_id);
    url.searchParams.set("department", config.department_id);
    window.history.replaceState({}, "", url.toString());
  }, [config]);

  return <KioskApp onReconfigure={onReconfigure} />;
};

export default ElectronWrapper;
