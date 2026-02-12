#!/usr/bin/env node

/**
 * WhatsApp Environment Configuration Validator
 * Validates all required environment variables for the WhatsApp-first queue system
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 WhatsApp Environment Configuration Validator");
console.log("=".repeat(50));

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const requiredVars = [
  // UltraMessage Core
  { key: "ULTRAMSG_INSTANCE_ID", description: "UltraMessage instance ID" },
  { key: "ULTRAMSG_TOKEN", description: "UltraMessage API token" },
  { key: "ULTRAMSG_BASE_URL", description: "UltraMessage base URL" },

  // WhatsApp Business
  { key: "WHATSAPP_BUSINESS_NUMBER", description: "WhatsApp business number" },
  { key: "WHATSAPP_ENABLED", description: "WhatsApp features enabled" },

  // Webhook
  { key: "ULTRAMSG_WEBHOOK_TOKEN", description: "Webhook security token" },
  {
    key: "ULTRAMSG_WEBHOOK_ENABLED",
    description: "Webhook processing enabled",
  },

  // Supabase
  { key: "NEXT_PUBLIC_SUPABASE_URL", description: "Supabase project URL" },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    description: "Supabase anonymous key",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Supabase service role key",
  },
];

const optionalVars = [
  { key: "WHATSAPP_DEBUG", description: "Debug mode", default: "false" },
  {
    key: "WHATSAPP_CONVERSATION_TIMEOUT",
    description: "Conversation timeout",
    default: "30",
  },
  {
    key: "WHATSAPP_QR_ENABLED",
    description: "QR code generation",
    default: "true",
  },
  {
    key: "WHATSAPP_NOTIFICATIONS_ENABLED",
    description: "Notifications",
    default: "true",
  },
  {
    key: "ULTRAMSG_WEBHOOK_URL",
    description: "Production webhook URL",
    default: "Not set (dev mode)",
  },
];

let allValid = true;

console.log("✅ Required Environment Variables:");
console.log("-".repeat(50));

requiredVars.forEach(({ key, description }) => {
  const value = process.env[key];
  if (value) {
    console.log(`✓ ${key}: ${description}`);
    console.log(
      `  Value: ${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`
    );
  } else {
    console.log(`❌ ${key}: ${description} - MISSING!`);
    allValid = false;
  }
  console.log("");
});

console.log("⚙️ Optional Environment Variables:");
console.log("-".repeat(50));

optionalVars.forEach(({ key, description, default: defaultValue }) => {
  const value = process.env[key];
  if (value) {
    console.log(`✓ ${key}: ${description}`);
    console.log(`  Value: ${value}`);
  } else {
    console.log(`⚠️ ${key}: ${description} - Using default: ${defaultValue}`);
  }
  console.log("");
});

// Validate UltraMessage configuration
console.log("🔧 UltraMessage Configuration Validation:");
console.log("-".repeat(50));

const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
if (instanceId && instanceId.startsWith("instance")) {
  console.log("✓ Instance ID format is correct");
} else {
  console.log('❌ Instance ID should start with "instance"');
  allValid = false;
}

const phoneNumber = process.env.WHATSAPP_BUSINESS_NUMBER;
if (phoneNumber && /^\d+$/.test(phoneNumber)) {
  console.log("✓ Phone number format is valid (digits only)");
} else {
  console.log("❌ Phone number should contain only digits (no + or spaces)");
  allValid = false;
}

const webhookToken = process.env.ULTRAMSG_WEBHOOK_TOKEN;
if (webhookToken && webhookToken.length >= 20) {
  console.log("✓ Webhook token has adequate length");
} else {
  console.log("⚠️ Webhook token should be at least 20 characters for security");
}

// Check if files exist
console.log("📁 File Configuration Check:");
console.log("-".repeat(50));

const files = [
  { path: ".env.local", description: "Admin app environment" },
  { path: "../kiosk-app/.env.local", description: "Kiosk app environment" },
  {
    path: "../supabase/migrations/20250903120000_whatsapp_first_conversation_system.sql",
    description: "Database migration",
  },
];

files.forEach(({ path, description }) => {
  const fullPath = path.startsWith("../") ? path : `./${path}`;
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${description}: Found at ${path}`);
  } else {
    console.log(`❌ ${description}: Missing at ${path}`);
    if (path.includes(".env.local")) {
      allValid = false;
    }
  }
});

console.log("");
console.log("=".repeat(50));

if (allValid) {
  console.log("🎉 All required environment variables are configured!");
  console.log("");
  console.log("Next steps:");
  console.log("1. Deploy the database migration");
  console.log("2. Configure UltraMessage webhook URL in dashboard");
  console.log("3. Test WhatsApp conversation flows");
  console.log("4. Deploy to production");
} else {
  console.log("❌ Some required configurations are missing!");
  console.log("");
  console.log("Please fix the missing variables and run this script again.");
  process.exit(1);
}

// Test UltraMessage connection (optional)
async function testUltraMessageConnection() {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;
  const baseUrl = process.env.ULTRAMSG_BASE_URL;

  if (!instanceId || !token || !baseUrl) {
    console.log("⚠️ Cannot test UltraMessage connection - missing credentials");
    return;
  }

  try {
    console.log("");
    console.log("🔗 Testing UltraMessage Connection...");

    const response = await fetch(`${baseUrl}/${instanceId}/instance/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ UltraMessage connection successful!");
      console.log(`   Instance status: ${data.accountStatus || "Unknown"}`);
    } else {
      console.log("❌ UltraMessage connection failed");
      console.log(`   Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log("❌ UltraMessage connection test failed");
    console.log(`   Error: ${error.message}`);
  }
}

// Uncomment to test connection (requires fetch polyfill for older Node.js)
// testUltraMessageConnection();
