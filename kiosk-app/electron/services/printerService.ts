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
  debugLog?: string[]; // Debug info to show in renderer console
}

// Printer instance
let printerInstance: ThermalPrinter | null = null;
let lastDetectedInterface: string | null = null;

// Printer configuration
interface PrinterConfig {
  type: PrinterTypes;
  interface: string;
  characterSet: CharacterSet;
  removeSpecialCharacters: boolean;
  width: number;
}

// USB Vendor IDs for common thermal printer manufacturers
const THERMAL_PRINTER_VENDORS = [
  '0x04b8', // Epson
  '0x04e8', // Samsung/Bixolon
  '0x0483', // STMicroelectronics (used by many Chinese printers)
  '0x0416', // Star Micronics
  '0x1504', // Citizen
  '0x154f', // Wincor Nixdorf
  '0x0456', // Flytech
  '0x0fe6', // ICS Advent
];

// Keywords that identify thermal printers in Windows printer names
const THERMAL_PRINTER_KEYWORDS = [
  'pos',
  'thermal',
  'receipt',
  'ticket',
  'epson',
  'star',
  'bixolon',
  'citizen',
  'esc/pos',
  'escpos',
  '80mm',
  '58mm',
  'gp-l',
];

// System printers list (populated by main process)
let systemPrinters: Array<{ name: string; displayName: string }> = [];

/**
 * Set the list of system printers (called from main process)
 */
export const setSystemPrinters = (printers: Array<{ name: string; displayName: string }>) => {
  systemPrinters = printers;
  console.log('System printers registered:', systemPrinters.map(p => p.name));
};

const DEFAULT_CONFIG: PrinterConfig = {
  type: PrinterTypes.EPSON,
  interface: "printer:auto", // Try auto-detect first
  characterSet: CharacterSet.WPC1252,
  removeSpecialCharacters: false,
  width: 48, // 80mm paper width in characters
};

/**
 * Detect thermal printers from Windows system printer list
 */
const detectWindowsPrinters = (): string[] => {
  log('=== Detecting Windows Thermal Printers ===');
  log(`Checking ${systemPrinters.length} system printers...`);
  
  const thermalPrinters: string[] = [];
  
  for (const printer of systemPrinters) {
    const printerNameLower = printer.name.toLowerCase();
    const displayNameLower = printer.displayName.toLowerCase();
    
    // Check if printer name contains thermal printer keywords
    const isThermalPrinter = THERMAL_PRINTER_KEYWORDS.some(keyword => 
      printerNameLower.includes(keyword) || displayNameLower.includes(keyword)
    );
    
    if (isThermalPrinter) {
      log(`  ✓ Found thermal printer: "${printer.name}"`);
      thermalPrinters.push(`printer:${printer.name}`);
    } else {
      log(`  - Skipping: "${printer.name}" (not a thermal printer)`);
    }
  }
  
  if (thermalPrinters.length === 0) {
    log('⚠ No thermal printers found in Windows printer list');
  } else {
    log(`✓ Found ${thermalPrinters.length} thermal printer(s)`);
  }
  
  return thermalPrinters;
};

/**
 * Detect available USB thermal printers
 * Returns the first found thermal printer interface or null
 */
const detectUSBPrinter = async (): Promise<string | null> => {
  try {
    console.log('=== Starting USB Printer Detection ===');
    // Try to use node-usb to detect thermal printers
    const usb = await import('usb');
    const devices = usb.getDeviceList();
    
    console.log(`Scanning ${devices.length} USB devices for thermal printers...`);
    
    for (const device of devices) {
      const vid = `0x${device.deviceDescriptor.idVendor.toString(16).padStart(4, '0')}`;
      const pid = `0x${device.deviceDescriptor.idProduct.toString(16).padStart(4, '0')}`;
      
      console.log(`  Found USB device: VID=${vid} PID=${pid}`);
      
      // Check if it's a known thermal printer vendor
      if (THERMAL_PRINTER_VENDORS.includes(vid.toLowerCase())) {
        const usbInterface = `usb://${vid}:${pid}`;
        console.log(`  ✓ Detected thermal printer: ${usbInterface}`);
        return usbInterface;
      }
    }
    
    console.log('No thermal printer found via USB detection');
    console.log('Known thermal printer vendors:', THERMAL_PRINTER_VENDORS);
    return null;
  } catch (error) {
    console.error('USB detection failed:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    return null;
  }
};

// Debug log collector for returning to renderer
let debugLogs: string[] = [];
const log = (message: string) => {
  console.log(message);
  debugLogs.push(message);
};
const clearDebugLogs = () => { debugLogs = []; };
const getDebugLogs = () => [...debugLogs];

/**
 * Try multiple printer interface methods
 */
const tryPrinterInterfaces = async (config: PrinterConfig): Promise<ThermalPrinter | null> => {
  log('=== Attempting Printer Connection ===');
  
  // Detect Windows thermal printers
  const windowsPrinters = detectWindowsPrinters();
  
  // Build list of interfaces to try, prioritizing Windows printers
  const interfacesToTry = [
    lastDetectedInterface, // Try last known working interface first
    ...windowsPrinters,    // Try Windows thermal printers (highest priority)
    'printer:auto',        // Try auto-detection
    await detectUSBPrinter(), // Try USB detection
    '//./usb',             // Windows USB printer
    '/dev/usb/lp0',        // Linux USB printer (first port)
    '/dev/usb/lp1',        // Linux USB printer (second port)
  ].filter(Boolean) as string[];
  
  log(`Interfaces to try: ${JSON.stringify(interfacesToTry)}`);
  log(`Platform: ${process.platform}`);
  
  for (const printerInterface of interfacesToTry) {
    try {
      log(`[${interfacesToTry.indexOf(printerInterface) + 1}/${interfacesToTry.length}] Attempting: ${printerInterface}`);
      
      const printer = new ThermalPrinter({
        type: config.type,
        interface: printerInterface,
        characterSet: config.characterSet,
        removeSpecialCharacters: config.removeSpecialCharacters,
        width: config.width,
      });
      
      log('  Printer instance created, checking connection...');
      const isConnected = await printer.isPrinterConnected();
      log(`  Connection check result: ${isConnected}`);
      
      if (isConnected) {
        log(`  ✓✓✓ SUCCESS! Connected via: ${printerInterface}`);
        lastDetectedInterface = printerInterface;
        return printer;
      } else {
        log(`  ✗ Not connected via: ${printerInterface}`);
      }
    } catch (error) {
      log(`  ✗ Error with ${printerInterface}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  log('=== All printer interfaces failed ===');
  return null;
};

/**
 * Initialize printer connection
 */
export const initializePrinter = async (
  config?: Partial<PrinterConfig>,
): Promise<boolean> => {
  try {
    const printerConfig = { ...DEFAULT_CONFIG, ...config };

    console.log('Initializing printer connection...');
    
    printerInstance = await tryPrinterInterfaces(printerConfig);

    if (!printerInstance) {
      console.error('Failed to connect to any printer interface');
      return false;
    }

    const isConnected = await printerInstance.isPrinterConnected();
    console.log("Printer initialized, connected:", isConnected);

    return isConnected;
  } catch (error) {
    console.error("Failed to initialize printer:", error);
    printerInstance = null;
    return false;
  }
};

/**
 * Check printer status
 */
export const getPrinterStatus = async (): Promise<PrinterStatus> => {
  clearDebugLogs(); // Reset debug logs
  
  log('╔═══════════════════════════════════════════════════════╗');
  log('║         PRINTER STATUS CHECK                          ║');
  log('╚═══════════════════════════════════════════════════════╝');
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`Current printer instance exists: ${!!printerInstance}`);
  log(`Last detected interface: ${lastDetectedInterface || 'none'}`);
  log(`System printers registered: ${systemPrinters.length}`);
  
  if (!printerInstance) {
    log('No printer instance found, attempting to initialize...');
    // Try to initialize if not already
    const initialized = await initializePrinter();
    if (!initialized) {
      log('❌ Initialization FAILED');
      return {
        connected: false,
        status: "Printer not found. Please check USB connection and ensure the printer is powered on.",
        debugLog: getDebugLogs(),
      };
    }
    log('✓ Initialization successful');
  }

  try {
    log('Checking if printer is connected...');
    const isConnected = await printerInstance!.isPrinterConnected();
    log(`isPrinterConnected() returned: ${isConnected}`);

    if (!isConnected) {
      log('❌ Printer reports as disconnected');
      // Reset instance to force redetection on next check
      printerInstance = null;
      return {
        connected: false,
        status: "Printer disconnected. Please check the USB cable.",
        debugLog: getDebugLogs(),
      };
    }

    log('✓✓✓ Printer is CONNECTED!');
    const statusMessage = lastDetectedInterface 
      ? `Ready (${lastDetectedInterface})` 
      : "Ready";
    log(`Status message: ${statusMessage}`);
    
    return {
      connected: true,
      status: statusMessage,
      printerType: "ESC/POS Thermal",
      debugLog: getDebugLogs(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log(`❌ Error during printer status check: ${errorMessage}`);
    
    // Reset instance on error
    printerInstance = null;
    
    return {
      connected: false,
      status: `Error: ${errorMessage}`,
      debugLog: getDebugLogs(),
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
