# Thermal Printer Fix - Kiosk App

## Latest Update: Native Windows Printing (February 15, 2026)

### Major Rewrite
Replaced the `node-thermal-printer` library with **Electron's native Windows printing API** for improved reliability and compatibility.

### Why the Change?
- `node-thermal-printer` requires the deprecated `printer` npm package which has unresolvable dependency conflicts
- "No driver set!" errors when attempting to connect to Windows printers
- Native Electron printing works with any Windows printer without additional drivers
- Better integration with Windows print system

### New Implementation

**File:** `kiosk-app/electron/services/nativePrinterService.ts`

#### Features:
1. **Automatic Thermal Printer Detection**
   - Scans Windows printer list for thermal printer keywords: `pos`, `thermal`, `receipt`, `gp-l`, `epson`, `star`, `bixolon`, etc.
   - Auto-selects first detected thermal printer
   - Works with POS-80C, GP-L80180, and other common thermal printers

2. **HTML-Based Ticket Rendering**
   - Generates professional HTML tickets with proper formatting
   - Supports QR codes, branding, and custom layouts
   - Prints to exact thermal paper width (80mm)

3. **Native Windows Print API**
   - Uses `webContents.print()` for reliable printing
   - Silent printing (no print dialog)
   - Proper margin handling for thermal printers

4. **Debug Logging**
   - Detailed logs forwarded to browser console via DevTools
   - Shows detected printers and connection status
   - Easy troubleshooting with real-time feedback

---

## Previous Implementation History

### Initial Problem
The kiosk app was not recognizing USB thermal printers, and the "Check Printer" button did not provide any feedback to users.

### First Iteration Fixes

#### 1. **Added Toast Notifications**
- Installed `react-hot-toast` library for user-friendly notifications
- Added `<Toaster />` component to KioskApp
- Now shows success/error toasts when checking printer status

#### 2. **Enhanced Printer Detection (node-thermal-printer)**
The printer service tried multiple detection methods:

1. **Last Known Interface** - If a printer was previously connected, tries that interface first
2. **Auto-detection** - `printer:auto` mode
3. **USB Device Scanning** - Scans for thermal printer vendor IDs:
   - Epson (0x04b8)
   - Samsung/Bixolon (0x04e8)
   - Star Micronics (0x0416)
   - Citizen (0x1504)
   - STMicroelectronics (0x0483)
4. **Platform-specific paths**:
   - Windows: `//./usb`, `printer:PrinterName`
   - Linux: `/dev/usb/lp0`, `/dev/usb/lp1`

### 3. **Better Error Messages**
- More descriptive error messages when printer is not found
- Shows the detected interface in the success message
- Logs all available system printers for debugging

### 4. **Fixed Check Printer Function**
The `checkPrinterStatus` function now:
- Actually calls the printer status check (was previously a no-op in Electron mode)
- Shows toast notification with result
- Lists all system printers in console for debugging
- Properly refreshes printer status

### 5. **Added Debugging Tools**
- New IPC method `printer:list` to get all system printers
- Enhanced console logging throughout printer detection
- USB device scanning with vendor ID detection

## How to Test

### 1. **Build and Run**
```powershell
cd kiosk-app
npm run electron:build
```

Or for development:
```powershell
npm run electron:dev
```

### 2. **Check Printer Connection**
1. Connect your USB thermal printer
2. Make sure the printer is powered on
3. Open the kiosk app
4. Go to Settings (gear icon)
5. Click "Check printer" button
6. You should see a toast notification:
   - ✅ Success: "Printer connected: Ready (usb://0x04b8:0x0e28)" (example)
   - ❌ Error: "Printer not found. Please check USB connection and ensure the printer is powered on."

### 3. **View Debug Info**
Open DevTools (if in dev mode) and check the console:
- You'll see all USB devices detected
- You'll see which printer interfaces were tried
- You'll see the list of all system printers

### 4. **Common Issues and Solutions**

#### Printer Not Detected
1. **Check USB Connection**
   - Ensure the USB cable is properly connected
   - Try a different USB port
   - Try a different USB cable

2. **Check Power**
   - Make sure the printer is powered on
   - Check if the printer has paper and is ready

3. **Check Drivers**
   - On Windows, install the manufacturer's USB driver
   - On Linux, ensure `libusb` is installed

4. **Check Permissions (Linux/macOS)**
   ```bash
   # Add user to dialout group
   sudo usermod -a -G dialout $USER
   
   # Or set udev rules for thermal printers
   sudo nano /etc/udev/rules.d/99-thermal-printer.rules
   # Add: SUBSYSTEM=="usb", ATTRS{idVendor}=="04b8", MODE="0666"
   ```

5. **Check Console Logs**
   - Open DevTools and look for:
     - "Scanning X USB devices for thermal printers..."
     - "Trying printer interfaces: [...]"
     - "Successfully connected via: ..."

#### Toast Not Showing
- Make sure you're running the compiled Electron app, not just the web version
- Check if `isElectron` is true in the console

## Technical Details

### Current Implementation (Native Windows Printing)

#### Files Created/Modified
1. **`kiosk-app/electron/services/nativePrinterService.ts`** (NEW)
   - Native Windows printing implementation
   - HTML ticket generation with QR codes
   - Auto-detection of thermal printers by name
   - Debug logging forwarded to renderer console

2. **`kiosk-app/electron/main.ts`**
   - Switched import from `printerService` to `nativePrinterService`
   - Uses Electron's `getPrintersAsync()` API
   - DevTools enabled in production for debugging

3. **`kiosk-app/src/KioskApp.tsx`**
   - Toast notifications for printer status
   - Phone input auto-focus in ticket modal
   - On-screen dial pad for phone number entry

4. **`kiosk-app/src/hooks/usePrinter.ts`**
   - Forwards debug logs from main process to console
   - Real-time printer status updates

5. **`kiosk-app/src/index.css`**
   - Dial pad styling (phone-style layout)
   - Touch-friendly button sizes
   - Visual feedback on interaction

#### Dependencies
- `react-hot-toast` - Toast notifications ✅
- `qrcode` - QR code generation for tickets ✅
- Native Electron APIs (no additional packages needed) ✅

#### Removed Dependencies
- ~~`node-thermal-printer`~~ - Replaced with native printing
- ~~`printer`~~ - Not needed (was causing conflicts)
- ~~`usb`~~ - Not required for native printing
- ~~`escpos`~~ - Not needed for Windows printing

## Known Limitations

1. **Windows Only**: Current implementation uses Windows printing API. For Linux/macOS support, would need platform-specific implementations.

2. **Thermal Printer Detection**: Relies on printer names containing keywords like "pos", "thermal", "receipt". Custom printer names may not be auto-detected.

3. **Print Quality**: HTML rendering quality depends on printer driver capabilities.

## Advantages of Native Printing

✅ **Zero Dependencies** - No problematic npm packages  
✅ **Universal Compatibility** - Works with any Windows printer  
✅ **No Driver Issues** - Uses Windows print system  
✅ **Easy Debugging** - HTML tickets can be previewed  
✅ **Rich Formatting** - Full HTML/CSS support for tickets  
✅ **QR Code Support** - Embedded QR codes for WhatsApp updates  

## New Features

### On-Screen Dial Pad
- **Auto-Focus**: Phone input automatically focused when ticket modal opens
- **Touch-Friendly**: Large 72x56px buttons optimized for touch screens
- **Phone-Style Layout**: 3x4 grid (1-9, +/0/⌫, Clear)
- **Visual Feedback**: Hover and active states for better UX
- **Keyboard Support**: Works with both dial pad and physical keyboard

### DevTools in Production
- F12 or Ctrl+Shift+D toggles DevTools
- Auto-opens on app start for easier printer debugging
- Real-time debug logs visible in console
- Easy troubleshooting on production kiosks

## Future Improvements

1. ✅ ~~Native Windows printing~~ (COMPLETED)
2. ✅ ~~Toast notifications~~ (COMPLETED)
3. ✅ ~~On-screen dial pad~~ (COMPLETED)
4. ✅ ~~Auto-focus phone input~~ (COMPLETED)
5. Add printer selection UI (if multiple thermal printers detected)
6. Support for network thermal printers
7. Custom ticket templates per organization
8. Printer settings (paper width, margins)
9. Print preview before printing
