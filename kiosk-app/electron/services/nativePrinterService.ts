/**
 * Native Windows Printer Service
 * Uses Electron's built-in printing API for reliable Windows printing
 */

import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as QRCode from 'qrcode';

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
  printerName?: string;
  debugLog?: string[];
}

// System printers list
let systemPrinters: Array<{ name: string; displayName: string }> = [];
let selectedPrinterName: string | null = null;

// Keywords that identify thermal printers
const THERMAL_PRINTER_KEYWORDS = [
  'pos',
  'thermal',
  'receipt',
  'ticket',
  'epson',
  'star',
  'bixolon',
  'citizen',
  '80mm',
  '58mm',
  'gp-l',
];

/**
 * Set the list of system printers
 */
export const setSystemPrinters = (printers: Array<{ name: string; displayName: string }>) => {
  systemPrinters = printers;
  console.log('System printers registered:', systemPrinters.map(p => p.name));
  
  // Auto-select first thermal printer
  if (!selectedPrinterName) {
    const thermalPrinter = findThermalPrinter();
    if (thermalPrinter) {
      selectedPrinterName = thermalPrinter;
      console.log('Auto-selected printer:', selectedPrinterName);
    }
  }
};

/**
 * Find a thermal printer from the system printers list
 */
const findThermalPrinter = (): string | null => {
  for (const printer of systemPrinters) {
    const nameLower = printer.name.toLowerCase();
    if (THERMAL_PRINTER_KEYWORDS.some(kw => nameLower.includes(kw))) {
      return printer.name;
    }
  }
  return null;
};

/**
 * Get printer status
 */
export const getPrinterStatus = async (): Promise<PrinterStatus> => {
  const debugLog: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    debugLog.push(msg);
  };

  log('╔═══════════════════════════════════════════════════════╗');
  log('║     NATIVE WINDOWS PRINTER STATUS CHECK               ║');
  log('╚═══════════════════════════════════════════════════════╝');
  log(`System printers available: ${systemPrinters.length}`);

  // Find thermal printer
  const thermalPrinters = systemPrinters.filter(p => 
    THERMAL_PRINTER_KEYWORDS.some(kw => p.name.toLowerCase().includes(kw))
  );

  log(`Thermal printers found: ${thermalPrinters.length}`);
  thermalPrinters.forEach(p => log(`  ✓ ${p.name}`));

  if (thermalPrinters.length === 0) {
    log('❌ No thermal printer found');
    return {
      connected: false,
      status: 'No thermal printer found. Please install a POS printer.',
      debugLog,
    };
  }

  // Use first thermal printer or previously selected one
  selectedPrinterName = selectedPrinterName || thermalPrinters[0].name;
  log(`Selected printer: ${selectedPrinterName}`);
  log('✓ Printer ready for native Windows printing');

  return {
    connected: true,
    status: `Ready (${selectedPrinterName})`,
    printerName: selectedPrinterName,
    printerType: 'Native Windows Print',
    debugLog,
  };
};

/**
 * Format time for display
 */
const formatTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

/**
 * Generate ticket HTML for printing
 */
const generateTicketHtml = async (ticketData: TicketData): Promise<string> => {
  let qrCodeDataUrl = '';
  if (ticketData.qr_code_url) {
    try {
      qrCodeDataUrl = await QRCode.toDataURL(ticketData.qr_code_url, {
        width: 150,
        margin: 1,
      });
    } catch (e) {
      console.error('Failed to generate QR code:', e);
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 80mm;
      padding: 5mm;
      background: white;
      color: black;
    }
    .header {
      text-align: center;
      border-top: 2px solid black;
      border-bottom: 2px solid black;
      padding: 8px 0;
      margin-bottom: 10px;
    }
    .org-name {
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .branch-name {
      font-size: 12px;
      margin-top: 4px;
    }
    .ticket-number {
      text-align: center;
      font-size: 48px;
      font-weight: bold;
      padding: 15px 0;
      letter-spacing: 2px;
    }
    .divider {
      border-top: 1px dashed black;
      margin: 10px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .label {
      font-weight: bold;
    }
    .position {
      text-align: center;
      font-size: 16px;
      margin: 10px 0;
    }
    .qr-section {
      text-align: center;
      margin: 15px 0;
    }
    .qr-code {
      width: 120px;
      height: 120px;
    }
    .qr-text {
      font-size: 10px;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      font-size: 11px;
      border-top: 1px solid black;
      padding-top: 10px;
    }
    .footer p {
      margin: 3px 0;
    }
    .timestamp {
      font-size: 10px;
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-name">${ticketData.organization_name}</div>
    ${ticketData.branch_name ? `<div class="branch-name">${ticketData.branch_name}</div>` : ''}
  </div>

  <div class="ticket-number">${ticketData.ticket_number}</div>

  <div class="divider"></div>

  <div class="info-row">
    <span class="label">Service:</span>
    <span>${ticketData.service_name}</span>
  </div>

  ${ticketData.department_name ? `
  <div class="info-row">
    <span class="label">Department:</span>
    <span>${ticketData.department_name}</span>
  </div>
  ` : ''}

  <div class="divider"></div>

  <div class="position">
    Position in Queue: <strong>#${ticketData.position}</strong>
  </div>

  <div class="info-row">
    <span class="label">Est. Wait:</span>
    <span>${ticketData.estimated_wait}</span>
  </div>

  ${qrCodeDataUrl ? `
  <div class="qr-section">
    <div class="qr-text">Scan for WhatsApp Updates</div>
    <img class="qr-code" src="${qrCodeDataUrl}" alt="QR Code"/>
  </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your patience!</p>
    <p>Please wait for your number.</p>
    <div class="timestamp">Issued: ${formatTime(ticketData.created_at)}</div>
  </div>
</body>
</html>
  `;
};

/**
 * Print a ticket using native Windows printing
 */
export const printTicket = async (
  ticketData: TicketData
): Promise<{ success: boolean; error?: string }> => {
  console.log('Printing ticket with native Windows printing...');
  console.log('Selected printer:', selectedPrinterName);

  if (!selectedPrinterName) {
    // Try to find a thermal printer
    const thermalPrinter = findThermalPrinter();
    if (!thermalPrinter) {
      return {
        success: false,
        error: 'No thermal printer found. Please check printer connection.',
      };
    }
    selectedPrinterName = thermalPrinter;
  }

  try {
    // Generate ticket HTML
    const ticketHtml = await generateTicketHtml(ticketData);

    // Create a hidden window for printing
    const printWindow = new BrowserWindow({
      width: 302, // ~80mm at 96dpi
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load the ticket HTML
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(ticketHtml)}`);

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Print to the selected printer
    return new Promise((resolve) => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: selectedPrinterName!,
          margins: {
            marginType: 'none',
          },
        },
        (success, failureReason) => {
          printWindow.close();
          
          if (success) {
            console.log('Ticket printed successfully');
            resolve({ success: true });
          } else {
            console.error('Print failed:', failureReason);
            resolve({
              success: false,
              error: `Print failed: ${failureReason}`,
            });
          }
        }
      );
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Print error:', error);
    return {
      success: false,
      error: `Print error: ${errorMessage}`,
    };
  }
};

/**
 * Print a test page
 */
export const printTestPage = async (): Promise<{ success: boolean; error?: string }> => {
  const testTicket: TicketData = {
    ticket_number: 'TEST-001',
    service_name: 'Test Service',
    position: 1,
    estimated_wait: '~5 minutes',
    created_at: new Date().toISOString(),
    organization_name: 'Smart Queue System',
    branch_name: 'Test Branch',
    department_name: 'Test Department',
  };

  return await printTicket(testTicket);
};

/**
 * Initialize printer (for compatibility)
 */
export const initializePrinter = async (): Promise<boolean> => {
  if (systemPrinters.length === 0) {
    console.log('No system printers registered yet');
    return false;
  }
  
  const thermalPrinter = findThermalPrinter();
  if (thermalPrinter) {
    selectedPrinterName = thermalPrinter;
    console.log('Initialized with printer:', selectedPrinterName);
    return true;
  }
  
  return false;
};
