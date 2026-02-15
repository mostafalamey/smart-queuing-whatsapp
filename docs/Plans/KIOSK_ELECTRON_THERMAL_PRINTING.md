# Kiosk Electron Wrapper with Thermal Printing

## Overview

Convert the kiosk web app to an Electron desktop application with USB thermal printer support and a department configuration system. A single executable works for any department via first-run setup wizard.

**Key Features:**

- USB thermal printer integration via `node-thermal-printer`
- First-run setup wizard for department assignment
- PIN-protected reconfiguration
- Auto-print tickets after creation
- Kiosk mode (fullscreen, no browser controls)

---

## Progress Tracker

| Phase   | Description                        | Status      |
| ------- | ---------------------------------- | ----------- |
| Phase 1 | Electron scaffolding & build setup | ✅ Complete |
| Phase 2 | Configuration service & storage    | ✅ Complete |
| Phase 3 | Setup wizard UI                    | ✅ Complete |
| Phase 4 | Reconfigure kiosk feature          | ✅ Complete |
| Phase 5 | Thermal printer service            | ✅ Complete |
| Phase 6 | Auto-print integration             | ✅ Complete |
| Phase 7 | Security hardening & build         | ✅ Complete |

---

## Phase 1: Electron Scaffolding & Build Setup

**Goal:** Set up Electron main process, preload script, and build configuration.

**Files to create:**

- `kiosk-app/electron/main.ts` — Main process entry point
- `kiosk-app/electron/preload.ts` — Context bridge for renderer
- `kiosk-app/electron-builder.json` — Build configuration
- `kiosk-app/src/types/electron.d.ts` — TypeScript definitions

**Package.json updates:**

- Add Electron dependencies
- Add dev/build scripts

---

## Phase 2: Configuration Service & Storage

**Goal:** Implement local config file storage for kiosk settings.

**Files to create:**

- `kiosk-app/electron/services/configService.ts`

**Config schema:**

```typescript
interface KioskConfig {
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
```

**IPC Handlers:**

- `config:load` — Read config from disk
- `config:save` — Write config to disk
- `config:isConfigured` — Check if setup complete
- `config:clear` — Factory reset

---

## Phase 3: Setup Wizard UI

**Goal:** Create first-run setup wizard for department assignment.

**Files to create:**

- `kiosk-app/src/components/setup/SetupWizard.tsx`
- `kiosk-app/src/components/setup/AdminLogin.tsx`
- `kiosk-app/src/components/setup/BranchSelector.tsx`
- `kiosk-app/src/components/setup/DepartmentSelector.tsx`
- `kiosk-app/src/components/setup/PinSetup.tsx`
- `kiosk-app/src/hooks/useKioskConfig.ts`

**Flow:**

1. Admin login (Supabase auth)
2. Select branch from organization
3. Select department within branch
4. Set 4-6 digit admin PIN
5. Confirmation & save

---

## Phase 4: Reconfigure Kiosk Feature

**Goal:** Allow PIN-protected reconfiguration without reinstall.

**Files to create:**

- `kiosk-app/src/components/admin/ReconfigureModal.tsx`
- `kiosk-app/src/components/admin/PinEntry.tsx`

**Trigger:** Long-press (3s) on organization logo or Ctrl+Shift+K

**Options after PIN entry:**

- Change department
- Change PIN
- Factory reset

---

## Phase 5: Thermal Printer Service

**Goal:** Implement USB thermal printing via node-thermal-printer.

**Files to create:**

- `kiosk-app/electron/services/printerService.ts`

**Features:**

- Auto-detect USB printer
- Format ticket content (ESC/POS commands)
- Print QR code for WhatsApp updates
- Check printer status (connected/paper)

**IPC Handlers:**

- `printer:print` — Print ticket
- `printer:status` — Check printer connectivity

---

## Phase 6: Auto-Print Integration

**Goal:** Auto-print tickets and integrate with existing UI.

**Files to modify:**

- `kiosk-app/src/hooks/usePrinter.ts`
- `kiosk-app/src/KioskApp.tsx`

**Changes:**

- Remove URL parameter parsing for org/dept
- Load config from Electron on mount
- Show setup wizard if not configured
- Auto-print after ticket creation
- Add printer status indicator

---

## Phase 7: Security Hardening & Build

**Goal:** Production-ready kiosk mode and Windows installer.

**Security measures:**

- Disable DevTools in production
- Disable right-click context menu
- Block external navigation
- Fullscreen kiosk mode
- PIN stored as bcrypt hash

**Build output:**

- Windows `.exe` installer
- Auto-updater configuration (optional)

---

## Files Summary

| File                                          | Phase | Action |
| --------------------------------------------- | ----- | ------ |
| `electron/main.ts`                            | 1     | Create |
| `electron/preload.ts`                         | 1     | Create |
| `electron-builder.json`                       | 1     | Create |
| `src/types/electron.d.ts`                     | 1     | Create |
| `package.json`                                | 1     | Modify |
| `electron/services/configService.ts`          | 2     | Create |
| `src/components/setup/SetupWizard.tsx`        | 3     | Create |
| `src/components/setup/AdminLogin.tsx`         | 3     | Create |
| `src/components/setup/BranchSelector.tsx`     | 3     | Create |
| `src/components/setup/DepartmentSelector.tsx` | 3     | Create |
| `src/components/setup/PinSetup.tsx`           | 3     | Create |
| `src/hooks/useKioskConfig.ts`                 | 3     | Create |
| `src/components/admin/ReconfigureModal.tsx`   | 4     | Create |
| `src/components/admin/PinEntry.tsx`           | 4     | Create |
| `electron/services/printerService.ts`         | 5     | Create |
| `src/hooks/usePrinter.ts`                     | 6     | Modify |
| `src/KioskApp.tsx`                            | 6     | Modify |

---

## Implementation Log

### Phase 1 Progress

- Started: 2026-02-15
- Completed: 2026-02-15
- Notes: Created Electron scaffolding with main.ts, preload.ts, TypeScript definitions, and build configuration. Updated package.json with Electron dependencies and scripts.

**Files created:**

- `electron/main.ts` - Main process with IPC handler stubs
- `electron/preload.ts` - Context bridge exposing electronAPI
- `electron/tsconfig.json` - TypeScript config for Electron files
- `electron-builder.json` - Build configuration for Windows/Mac/Linux
- `src/types/electron.d.ts` - TypeScript definitions for window.electronAPI

**Package.json updates:**

- Added: electron, electron-builder, concurrently, wait-on, bcryptjs
- Added scripts: electron:dev, electron:build, electron:compile, electron:pack

### Phase 2 Progress

- Started: 2026-02-15
- Completed: 2026-02-15
- Notes: Implemented config service with bcrypt PIN hashing, updated IPC handlers in main.ts

**Files created:**

- `electron/services/configService.ts` - Full config load/save/clear/PIN verify/update implementation

**Files updated:**

- `electron/main.ts` - Integrated configService with IPC handlers
- `electron/preload.ts` - Updated save signature to accept config + pin separately
- `src/types/electron.d.ts` - Added KioskConfigInput interface

### Phase 3 Progress

- Started: 2026-02-15
- Completed: 2026-02-15
- Notes: Created setup wizard with 4-step flow (login → branch → department → PIN)

**Files created:**

- `src/components/setup/SetupWizard.tsx` - Main wizard orchestrator
- `src/components/setup/AdminLogin.tsx` - Admin authentication
- `src/components/setup/BranchSelector.tsx` - Branch selection
- `src/components/setup/DepartmentSelector.tsx` - Department selection
- `src/components/setup/PinSetup.tsx` - PIN entry with confirmation
- `src/components/setup/index.ts` - Exports
- `src/hooks/useKioskConfig.ts` - Hook for managing config state

### Phase 4 Progress

- Started: 2026-02-15
- Completed: 2026-02-15
- Notes: Created reconfigure modal with PIN auth, change PIN, and factory reset options

**Files created:**

- `src/components/admin/ReconfigureModal.tsx` - Main settings modal with PIN auth
- `src/components/admin/PinEntry.tsx` - Reusable PIN entry with lockout
- `src/components/admin/index.ts` - Exports

**Features:**

- PIN verification with 3-attempt lockout (5 min cooldown)
- Change department option
- Change PIN flow (current → new → confirm)
- Factory reset with confirmation

### Phase 5 Progress

- Started: 2026-02-15
- Completed: 2026-02-15
- Notes: Implemented full thermal printer service using node-thermal-printer

**Files created:**

- `electron/services/printerService.ts` - Full ESC/POS printer implementation

**Features:**

- USB printer auto-detection
- Formatted ticket printing with org branding
- QR code printing support
- Test page printing
- Printer status checking

**Files updated:**

- `electron/main.ts` - Integrated printerService with IPC handlers
- `electron/preload.ts` - Added test print function
- `src/types/electron.d.ts` - Extended TicketData interface

### Phase 6 Progress

- Started: 2026-02-15
- Completed: 2026-02-15
- Notes: Integrated Electron wrapper, setup wizard, and printer into KioskApp

**Files created:**

- `src/ElectronWrapper.tsx` - Main entry wrapper handling setup flow and reconfigure access

**Files updated:**

- `src/main.tsx` - Updated to use ElectronWrapper
- `src/hooks/usePrinter.ts` - Full rewrite with Electron IPC integration
- `src/KioskApp.tsx` - Integrated usePrinter hook for Electron printing

**Features:**

- Setup wizard flow when not configured
- Long-press (3s) on logo corner for reconfigure modal
- Ctrl+Shift+K keyboard shortcut for reconfigure
- Auto-print tickets via Electron when available
- Graceful fallback for browser development

### Phase 7 Progress

- Started: 2026-02-15
- Completed: 2026-02-15
- Notes: Added security hardening, fixed TypeScript errors, cleaned up stale files

**Security additions to main.ts:**

- Disabled right-click context menu in production
- Blocked dangerous keyboard shortcuts (F12, F5, Ctrl+Shift+I, Ctrl+R, Alt+F4)
- External navigation prevention already in place
- Kiosk mode fullscreen enabled in production

**Code cleanup:**

- Fixed printerService.ts imports for node-thermal-printer
- Updated tsconfig.json to support Vite/import.meta.env
- Added @types/node to devDependencies
- Removed stale files: src/App.tsx, src/services/printer.ts, src/components/PrintButton.tsx
- Fixed unused variable warnings in KioskApp.tsx
- Fixed type assertions in AdminLogin.tsx
- Fixed printTicket function typing in KioskApp.tsx

**Build resources:**

- Created build-resources/README.md with icon requirements

**Verified:**

- npm run electron:compile ✅
- npm run typecheck ✅
- All TypeScript errors resolved

---

## Implementation Complete

All 7 phases have been implemented. To build the production application:

```bash
cd kiosk-app
npm install
npm run electron:build
```

The installer will be output to `kiosk-app/dist/`.
