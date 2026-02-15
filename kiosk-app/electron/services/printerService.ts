import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} from "node-thermal-printer";
import * as QRCode from "qrcode";

/**
 * Thermal Printer Service
 * Handles USB thermal printer operations for ticket printing
 */

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

export interface PrinterStatus {
  connected: boolean;
  status: string;
  paperLow?: boolean;
  printerType?: string;
}

// Printer instance
let printerInstance: ThermalPrinter | null = null;

// Printer configuration
interface PrinterConfig {
  type: PrinterTypes;
  interface: string;
  characterSet: CharacterSet;
  removeSpecialCharacters: boolean;
  width: number;
}

const DEFAULT_CONFIG: PrinterConfig = {
  type: PrinterTypes.EPSON,
  interface: "printer:auto", // Auto-detect USB printer
  characterSet: CharacterSet.WPC1252,
  removeSpecialCharacters: false,
  width: 48, // 80mm paper width in characters
};

/**
 * Initialize printer connection
 */
export const initializePrinter = async (
  config?: Partial<PrinterConfig>,
): Promise<boolean> => {
  try {
    const printerConfig = { ...DEFAULT_CONFIG, ...config };

    printerInstance = new ThermalPrinter({
      type: printerConfig.type,
      interface: printerConfig.interface,
      characterSet: printerConfig.characterSet,
      removeSpecialCharacters: printerConfig.removeSpecialCharacters,
      width: printerConfig.width,
    });

    const isConnected = await printerInstance.isPrinterConnected();
    console.log("Printer initialized, connected:", isConnected);

    return isConnected;
  } catch (error) {
    console.error("Failed to initialize printer:", error);
    return false;
  }
};

/**
 * Check printer status
 */
export const getPrinterStatus = async (): Promise<PrinterStatus> => {
  if (!printerInstance) {
    // Try to initialize if not already
    const initialized = await initializePrinter();
    if (!initialized) {
      return {
        connected: false,
        status: "Printer not found. Please check USB connection.",
      };
    }
  }

  try {
    const isConnected = await printerInstance!.isPrinterConnected();

    if (!isConnected) {
      return {
        connected: false,
        status: "Printer disconnected",
      };
    }

    return {
      connected: true,
      status: "Ready",
      printerType: "ESC/POS Thermal",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      connected: false,
      status: `Error: ${errorMessage}`,
    };
  }
};

/**
 * Generate QR code as buffer for printing
 */
const generateQRCodeBuffer = async (url: string): Promise<Buffer | null> => {
  try {
    const qrBuffer = await QRCode.toBuffer(url, {
      type: "png",
      width: 200,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return qrBuffer;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    return null;
  }
};

/**
 * Format time for display
 */
const formatTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

/**
 * Print a ticket
 */
export const printTicket = async (
  ticketData: TicketData,
): Promise<{ success: boolean; error?: string }> => {
  // Ensure printer is initialized
  if (!printerInstance) {
    const initialized = await initializePrinter();
    if (!initialized) {
      return {
        success: false,
        error: "Printer not connected. Please check USB connection.",
      };
    }
  }

  try {
    const printer = printerInstance!;

    // Clear any pending data
    printer.clear();

    // ============ Header ============
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println("═".repeat(32));
    printer.setTextSize(2, 2);
    printer.println(ticketData.organization_name.toUpperCase());
    printer.setTextSize(1, 1);
    if (ticketData.branch_name) {
      printer.println(ticketData.branch_name);
    }
    printer.println("═".repeat(32));
    printer.bold(false);
    printer.newLine();

    // ============ Ticket Number (Large) ============
    printer.alignCenter();
    printer.setTextSize(3, 3);
    printer.bold(true);
    printer.println(ticketData.ticket_number);
    printer.bold(false);
    printer.setTextSize(1, 1);
    printer.newLine();

    // ============ Service Info ============
    printer.alignLeft();
    printer.drawLine();

    printer.bold(true);
    printer.print("Service: ");
    printer.bold(false);
    printer.println(ticketData.service_name);

    if (ticketData.department_name) {
      printer.bold(true);
      printer.print("Department: ");
      printer.bold(false);
      printer.println(ticketData.department_name);
    }

    printer.newLine();

    // ============ Queue Info ============
    printer.bold(true);
    printer.print("Position in Queue: ");
    printer.bold(false);
    printer.println(`#${ticketData.position}`);

    printer.bold(true);
    printer.print("Estimated Wait: ");
    printer.bold(false);
    printer.println(ticketData.estimated_wait);

    printer.newLine();

    // ============ Time ============
    printer.drawLine();
    printer.alignCenter();
    printer.println(`Issued: ${formatTime(ticketData.created_at)}`);
    printer.drawLine();
    printer.newLine();

    // ============ QR Code ============
    if (ticketData.qr_code_url) {
      printer.alignCenter();
      printer.println("Scan for WhatsApp Updates:");
      printer.newLine();

      // Print QR code
      const qrBuffer = await generateQRCodeBuffer(ticketData.qr_code_url);
      if (qrBuffer) {
        await printer.printImageBuffer(qrBuffer);
      } else {
        // Fallback: print URL if QR fails
        printer.println(ticketData.qr_code_url);
      }
      printer.newLine();
    }

    // ============ Footer ============
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.println("Thank you for your patience!");
    printer.println("Please wait for your number to be called.");
    printer.newLine();

    printer.println("─".repeat(32));
    printer.setTextNormal();
    printer.println("Smart Queue System");
    printer.println("─".repeat(32));

    // Feed and cut
    printer.newLine();
    printer.newLine();
    printer.cut();

    // Execute print
    await printer.execute();

    console.log("Ticket printed successfully:", ticketData.ticket_number);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown print error";
    console.error("Print error:", error);
    return {
      success: false,
      error: `Print failed: ${errorMessage}`,
    };
  }
};

/**
 * Print a test page
 */
export const printTestPage = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  const testTicket: TicketData = {
    ticket_number: "TEST-001",
    service_name: "Test Service",
    position: 1,
    estimated_wait: "~5 minutes",
    created_at: new Date().toISOString(),
    organization_name: "Smart Queue System",
    branch_name: "Test Branch",
    department_name: "Test Department",
    qr_code_url: "https://example.com/test",
  };

  return await printTicket(testTicket);
};

/**
 * Close printer connection
 */
export const closePrinter = (): void => {
  if (printerInstance) {
    printerInstance.clear();
    printerInstance = null;
    console.log("Printer connection closed");
  }
};
