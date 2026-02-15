# DevTools Enabled for Printer Debugging

## What Was Changed

I've enabled DevTools in the production build and added extensive logging to help diagnose the printer detection issue.

### Changes Made:

1. **DevTools Auto-Opens** - The built app now automatically opens DevTools when launched
2. **Keyboard Shortcuts Enabled**:
   - `F12` - Toggle DevTools
   - `Ctrl+Shift+I` - Open DevTools
   - `Ctrl+Shift+D` - Toggle DevTools
3. **Enhanced Logging** - Comprehensive console logging for printer detection

## How to Debug

### Step 1: Launch the Built App

The installer is located at:
```
C:\Users\Mega Store\Documents\smart-queuing-whatsapp\kiosk-app\release\Smart Queue Kiosk-2.0.0-Setup.exe
```

Or run the unpacked version:
```
C:\Users\Mega Store\Documents\smart-queuing-whatsapp\kiosk-app\release\win-unpacked\Smart Queue Kiosk.exe
```

### Step 2: DevTools Will Open Automatically

When the app launches, DevTools will open on the right side showing the Console tab.

### Step 3: Check Initial Logs

Look for these startup messages in the console:
```
Loading index from: ...
Electron preload script loaded
```

### Step 4: Click "Check Printer" Button

1. Go to **Settings** (gear icon in top-right)
2. Click the **"Check printer"** button  
3. Watch the Console tab in DevTools

### Step 5: Analyze the Logs

You should see detailed output like:

```
╔═══════════════════════════════════════════════════════╗
║         PRINTER STATUS CHECK                        ║
╚═══════════════════════════════════════════════════════╝
Timestamp: 2026-02-15T...
Current printer instance exists: false
Last detected interface: none
No printer instance found, attempting to initialize...
Initializing printer connection...

=== Attempting Printer Connection ===
Interfaces to try: ['printer:auto', '//./usb']
Platform: win32

=== Starting USB Printer Detection ===
Scanning X USB devices for thermal printers...
  Found USB device: VID=0x04b8 PID=0x0e28
  ✓ Detected thermal printer: usb://0x04b8:0x0e28

[1/3] Attempting: printer:auto
  Printer instance created, checking connection...
  Connection check result: false
  ✗ Not connected via: printer:auto

[2/3] Attempting: usb://0x04b8:0x0e28
  Printer instance created, checking connection...
  Connection check result: true
  ✓✓✓ SUCCESS! Connected via: usb://0x04b8:0x0e28
```

### What to Look For

#### ✅ **Good Signs:**
- "Scanning X USB devices" shows devices were found
- "Detected thermal printer" shows your printer was recognized
- "SUCCESS! Connected via:" shows successful connection
- Toast notification shows "Printer connected"

#### ❌ **Problem Signs:**

**If you see:**
```
Scanning 0 USB devices for thermal printers...
No thermal printer found via USB detection
```
**Issue:** USB module is not detecting devices
**Solution:** 
- Check if the app has permissions to access USB
- Try running as Administrator
- The USB library may need to be rebuilt for your system

**If you see:**
```
USB detection failed: Error: ...
```
**Issue:** USB library error
**Copy the full error message** - we may need to try a different detection method

**If you see:**
```
Found USB device: VID=0xXXXX PID=0xYYYY
```
for your printer but **not** "Detected thermal printer"
**Issue:** Your printer's Vendor ID is not in our known list
**Solution:** Note the VID and PID - I'll add it to the detection list

**If you see:**
```
Attempting: usb://0xXXXX:0xYYYY
Printer instance created, checking connection...
Connection check result: false
```
**Issue:** The USB path is correct but the printer library can't connect
**Possible causes:**
- Printer driver not installed
- Printer not in ESC/POS mode
- Printer requires different connection parameters

### Step 6: Check Windows System Printers

The app also logs all printers Windows sees:
```
Available system printers: [
  { name: 'Microsoft Print to PDF', displayName: '...' },
  { name: 'POS-80', displayName: '...' }
]
```

**Look for your thermal printer name** - if Windows sees it but we can't connect, we may need to try connecting via the Windows printer name instead of USB.

## Common Issues & Solutions

### Issue: "USB detection failed: Cannot find module 'usb'"

The USB library failed to install/compile correctly.

**Try:**
```powershell
cd kiosk-app
npm rebuild usb
npm run electron:build
```

### Issue: Printer found but connection fails

Your printer might use a non-standard interface.

**What to tell me:**
1. The exact Vendor ID (VID) and Product ID (PID) shown in logs
2. The printer brand and model
3. Whether Windows can print to it (and what driver is installed)

### Issue: No USB devices found at all

The USB library might not have permissions.

**Try:**
- Run the app as Administrator
- Check Windows Device Manager - is the printer showing up?
- Try a different USB port

## Next Steps

After running the "Check Printer" button and reviewing the DevTools console:

1. **Take a screenshot** of the full console output
2. **Copy all the text** from the printer check section
3. **Share the information** so I can:
   - Add your printer's VID to the detection list
   - Modify the connection method if needed
   - Try alternative detection approaches

## Closing DevTools (When Done Debugging)

- Press `F12` or `Ctrl+Shift+D` to close DevTools
- The app will remember this won't interfere with normal use

## Reverting to Normal (After Fix)

Once we solve the issue, I can remove:
- Auto-opening of DevTools
- The verbose logging
- The unblocked keyboard shortcuts

For now, having them enabled is essential for debugging.
