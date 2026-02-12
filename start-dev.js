#!/usr/bin/env node

/**
 * Smart Queue System - Development Startup Script
 * Starts both admin dashboard and customer app in development mode
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function colorLog(color, label, message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(
    `${colors[color]}[${timestamp}] [${label}]${colors.reset} ${message}`
  );
}

function startProcess(command, args, cwd, label, color) {
  if (!fs.existsSync(cwd)) {
    colorLog("red", "ERROR", `Directory does not exist: ${cwd}`);
    return null;
  }

  colorLog("cyan", "STARTUP", `Starting ${label}...`);

  const process = spawn(command, args, {
    cwd,
    stdio: "pipe",
    shell: true,
  });

  process.stdout.on("data", (data) => {
    const output = data.toString().trim();
    if (output) {
      colorLog(color, label, output);
    }
  });

  process.stderr.on("data", (data) => {
    const output = data.toString().trim();
    if (output && !output.includes("ExperimentalWarning")) {
      colorLog("yellow", label, output);
    }
  });

  process.on("close", (code) => {
    if (code !== 0) {
      colorLog("red", label, `Process exited with code ${code}`);
    }
  });

  process.on("error", (error) => {
    colorLog("red", label, `Process error: ${error.message}`);
  });

  return process;
}

async function checkAndInstallDependencies() {
  colorLog("blue", "SETUP", "Checking dependencies...");

  const adminDir = path.join(process.cwd(), "admin-app");
  const kioskDir = path.join(process.cwd(), "kiosk-app");

  // Check if admin dependencies are installed
  if (
    fs.existsSync(adminDir) &&
    !fs.existsSync(path.join(adminDir, "node_modules"))
  ) {
    colorLog("yellow", "SETUP", "Installing admin app dependencies...");
    const adminInstall = spawn("npm", ["install"], {
      cwd: adminDir,
      stdio: "inherit",
      shell: true,
    });
    await new Promise((resolve) => adminInstall.on("close", resolve));
  }

  // Check if kiosk dependencies are installed
  if (
    fs.existsSync(kioskDir) &&
    !fs.existsSync(path.join(kioskDir, "node_modules"))
  ) {
    colorLog("yellow", "SETUP", "Installing kiosk app dependencies...");
    const kioskInstall = spawn("npm", ["install"], {
      cwd: kioskDir,
      stdio: "inherit",
      shell: true,
    });
    await new Promise((resolve) => kioskInstall.on("close", resolve));
  }
}

async function startDevelopment() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log(
    "╔══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║            WhatsApp-First Queue System                      ║"
  );
  console.log(
    "║              Development Environment                         ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝"
  );
  console.log(colors.reset);

  const rootDir = process.cwd();
  const processes = [];

  // Check dependencies first
  await checkAndInstallDependencies();

  colorLog("green", "INFO", "Starting development servers...");

  // Start Admin Dashboard on port 3001
  const adminDir = path.join(rootDir, "admin-app");
  if (fs.existsSync(adminDir)) {
    const adminProcess = startProcess(
      "npm",
      ["run", "dev"],
      adminDir,
      "Admin Dashboard",
      "blue"
    );
    if (adminProcess) processes.push(adminProcess);

    // Wait for admin to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
  } else {
    colorLog("red", "ERROR", "Admin app directory not found at: " + adminDir);
  }

  // Start Kiosk App on port 3003 (using Vite)
  const kioskDir = path.join(rootDir, "kiosk-app");
  if (fs.existsSync(kioskDir)) {
    const kioskProcess = startProcess(
      "npm",
      ["run", "dev"],
      kioskDir,
      "Kiosk App",
      "magenta"
    );
    if (kioskProcess) processes.push(kioskProcess);
  } else {
    colorLog(
      "yellow",
      "WARNING",
      "Kiosk app directory not found at: " + kioskDir
    );
    colorLog("yellow", "INFO", "Only admin dashboard will be available");
  }

  // Wait a bit for all processes to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Display application URLs
  console.log("");
  console.log(
    `${colors.bright}${colors.green}🌐 Application URLs:${colors.reset}`
  );
  console.log(
    `${colors.cyan}   📊 Admin Dashboard: http://localhost:3001${colors.reset}`
  );
  if (fs.existsSync(kioskDir)) {
    console.log(
      `${colors.magenta}   🏪 Kiosk App: http://localhost:3003${colors.reset}`
    );
  }
  console.log("");
  console.log(`${colors.yellow}💡 Development Tips:${colors.reset}`);
  console.log("   • Use Ctrl+C to stop all processes");
  console.log("   • Keep browser Developer Tools open to disable cache");
  console.log("   • Use hard refresh (Ctrl+Shift+R) if pages don't load");
  console.log("   • Admin app uses Next.js, Kiosk app uses Vite");
  console.log(
    "   • WhatsApp webhook endpoint: http://localhost:3001/api/webhooks/whatsapp/inbound"
  );
  console.log("");

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("");
    colorLog("yellow", "SHUTDOWN", "Stopping all development servers...");

    processes.forEach((proc, index) => {
      if (proc && !proc.killed) {
        proc.kill("SIGTERM");
        setTimeout(() => {
          if (!proc.killed) {
            proc.kill("SIGKILL");
          }
        }, 5000); // Force kill after 5 seconds
      }
    });

    setTimeout(() => {
      colorLog("green", "SHUTDOWN", "All processes stopped. Goodbye! 👋");
      process.exit(0);
    }, 1000);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    colorLog("red", "ERROR", `Uncaught Exception: ${error.message}`);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    colorLog(
      "red",
      "ERROR",
      `Unhandled Rejection at: ${promise}, reason: ${reason}`
    );
  });
}

// Check if running directly
if (require.main === module) {
  startDevelopment().catch((error) => {
    colorLog(
      "red",
      "FATAL",
      `Failed to start development environment: ${error.message}`
    );
    process.exit(1);
  });
}

module.exports = { startDevelopment };
