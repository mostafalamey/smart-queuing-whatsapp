import { useEffect, useState, useCallback } from "react";
import type { TicketData, PrinterStatus } from "../types/electron";

interface UsePrinterResult {
  isPrinting: boolean;
  printerStatus: PrinterStatus | null;
  error: string | null;
  isElectron: boolean;
  printTicket: (
    ticketData: TicketData,
  ) => Promise<{ success: boolean; error?: string }>;
  printTestPage: () => Promise<{ success: boolean; error?: string }>;
  checkStatus: () => Promise<void>;
}

/**
 * Hook for interacting with the thermal printer via Electron IPC
 * Falls back gracefully when not running in Electron
 */
const usePrinter = (): UsePrinterResult => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Check if running in Electron
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  // Check printer status
  const checkStatus = useCallback(async () => {
    if (!isElectron) {
      setPrinterStatus({ connected: false, status: "Not running in Electron" });
      return;
    }

    try {
      const status = await window.electronAPI!.printer.status();
      
      // Log debug info from main process to browser console
      if (status.debugLog && status.debugLog.length > 0) {
        console.log('\n========== PRINTER DEBUG LOG ==========');
        status.debugLog.forEach(line => console.log(line));
        console.log('========================================\n');
      }
      
      setPrinterStatus(status);
    } catch (err) {
      console.error("Failed to check printer status:", err);
      setPrinterStatus({ connected: false, status: "Error checking status" });
    }
  }, [isElectron]);

  // Check status on mount
  useEffect(() => {
    checkStatus();

    // Poll status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Print ticket
  const printTicket = useCallback(
    async (
      ticketData: TicketData,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isElectron) {
        // Fallback for non-Electron: log and show alert
        console.log("Print ticket (non-Electron):", ticketData);
        return { success: true }; // Simulate success for browser testing
      }

      setIsPrinting(true);
      setError(null);

      try {
        const result = await window.electronAPI!.printer.print(ticketData);

        if (!result.success) {
          setError(result.error || "Print failed");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to print ticket";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsPrinting(false);
      }
    },
    [isElectron],
  );

  // Print test page
  const printTestPage = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!isElectron) {
      console.log("Print test page (non-Electron)");
      return { success: true };
    }

    setIsPrinting(true);
    setError(null);

    try {
      const result = await window.electronAPI!.printer.test();

      if (!result.success) {
        setError(result.error || "Test print failed");
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to print test page";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsPrinting(false);
    }
  }, [isElectron]);

  return {
    isPrinting,
    printerStatus,
    error,
    isElectron,
    printTicket,
    printTestPage,
    checkStatus,
  };
};

export default usePrinter;
