import { app, BrowserWindow, ipcMain, shell, globalShortcut } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as configService from "./services/configService";
// Use native Windows printing instead of node-thermal-printer for better compatibility
import * as printerService from "./services/nativePrinterService";

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    fullscreen: !isDev, // Fullscreen in production (kiosk mode)
    kiosk: !isDev, // True kiosk mode in production
    frame: isDev, // Show frame only in dev
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for preload script
      webSecurity: false, // Allow HTTPS requests from file:// protocol (kiosk app)
    },
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    // __dirname is electron/ folder, dist is at the same level
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    console.log("Loading index from:", indexPath);
    console.log("File exists:", fs.existsSync(indexPath));
    console.log("__dirname:", __dirname);
    console.log("app.getAppPath():", app.getAppPath());

    mainWindow.loadFile(indexPath);

    // TEMPORARY: Open DevTools for debugging printer issues
    mainWindow.webContents.openDevTools();

    // Security: Disable right-click context menu in production
    mainWindow.webContents.on("context-menu", (e) => {
      e.preventDefault();
    });
  }

  // Register Escape key to exit kiosk mode (for admin use)
  globalShortcut.register("Escape", () => {
    if (mainWindow) {
      mainWindow.setKiosk(false);
      mainWindow.setFullScreen(false);
    }
  });

  // Register Ctrl+Q to quit the app
  globalShortcut.register("CommandOrControl+Q", () => {
    app.quit();
  });

  // Register Ctrl+Shift+D to toggle DevTools (for debugging)
  globalShortcut.register("CommandOrControl+Shift+D", () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Security: Prevent navigation to external URLs
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const parsedUrl = new URL(url);
    if (
      parsedUrl.origin !== "http://localhost:5173" &&
      !url.startsWith("file://")
    ) {
      event.preventDefault();
    }
  });

  // Security: Prevent opening new windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow opening external URLs in default browser if needed
    if (url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Security: Block dangerous keyboard shortcuts in production
  if (!isDev) {
    mainWindow.webContents.on("before-input-event", (event, input) => {
      // TEMPORARY: Allow F12 and DevTools shortcuts for debugging
      // Block Ctrl+R (refresh), Alt+F4 (close), but allow F12 and DevTools
      const blockedKeys = ["F5"]; // Removed F12 temporarily

      if (blockedKeys.includes(input.key)) {
        event.preventDefault();
        return;
      }

      // Block Ctrl+R
      if (input.control && !input.shift && !input.alt && input.key.toUpperCase() === "R") {
        event.preventDefault();
        return;
      }

      // Block Alt+F4
      if (input.alt && !input.control && !input.shift && input.key === "F4") {
        event.preventDefault();
        return;
      }
    });
  }

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS re-create window when dock icon clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Unregister shortcuts before quitting
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// ============================================================================
// IPC Handlers - Config Service
// ============================================================================

ipcMain.handle("config:isConfigured", async () => {
  return configService.isConfigured();
});

ipcMain.handle("config:load", async () => {
  return configService.loadConfig();
});

ipcMain.handle(
  "config:save",
  async (
    _event,
    configData: {
      config: Omit<configService.KioskConfig, "admin_pin_hash">;
      pin?: string;
    },
  ) => {
    return await configService.saveConfig(configData.config, configData.pin);
  },
);

ipcMain.handle("config:clear", async () => {
  return configService.clearConfig();
});

// ============================================================================
// IPC Handlers - PIN Service
// ============================================================================

ipcMain.handle("pin:verify", async (_event, pin: string) => {
  return await configService.verifyPin(pin);
});

ipcMain.handle("pin:update", async (_event, oldPin: string, newPin: string) => {
  return await configService.updatePin(oldPin, newPin);
});

// ============================================================================
// IPC Handlers - Printer Service
// ============================================================================

ipcMain.handle("printer:status", async () => {
  // First, update the printer service with current system printers
  try {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      const printers = await mainWindow.webContents.getPrintersAsync();
      const printerList = printers.map(p => ({
        name: p.name,
        displayName: p.displayName || p.name,
      }));
      printerService.setSystemPrinters(printerList);
    }
  } catch (error) {
    console.error('Failed to get system printers:', error);
  }
  
  return await printerService.getPrinterStatus();
});

ipcMain.handle(
  "printer:print",
  async (_event, ticketData: printerService.TicketData) => {
    return await printerService.printTicket(ticketData);
  },
);

ipcMain.handle("printer:test", async () => {
  return await printerService.printTestPage();
});

// Get list of system printers (for debugging)
ipcMain.handle("printer:list", async () => {
  try {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return [];
    
    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log('System printers:', printers.map(p => p.name));
    return printers.map(p => ({
      name: p.name,
      displayName: p.displayName || p.name,
      description: p.description || '',
    }));
  } catch (error) {
    console.error('Failed to get printer list:', error);
    return [];
  }
});

// ============================================================================
// IPC Handlers - App Info
// ============================================================================

ipcMain.handle("app:getVersion", async () => {
  return app.getVersion();
});

ipcMain.handle("app:isPackaged", async () => {
  return app.isPackaged;
});
