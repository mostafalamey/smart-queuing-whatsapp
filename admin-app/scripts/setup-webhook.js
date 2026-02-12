/**
 * UltraMessage Webhook Configuration Helper
 * Run this after deploying to production to configure webhook URL
 */

require("dotenv").config({ path: ".env.local" });

const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;
const ULTRAMSG_BASE_URL = process.env.ULTRAMSG_BASE_URL;

console.log("🔗 UltraMessage Webhook Configuration Guide");
console.log("=".repeat(50));

if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
  console.log("❌ Missing UltraMessage credentials in environment variables");
  process.exit(1);
}

console.log("📋 Configuration Details:");
console.log(`   Instance ID: ${ULTRAMSG_INSTANCE_ID}`);
console.log(`   Token: ${ULTRAMSG_TOKEN.substring(0, 8)}...`);
console.log("");

console.log("🌐 Webhook Configuration:");
console.log("-".repeat(30));
console.log("1. Go to your UltraMessage dashboard");
console.log("2. Navigate to Settings > Webhooks");
console.log("3. Configure these settings:");
console.log("");

// Development webhook URL
const devWebhookUrl = "http://localhost:3001/api/webhooks/whatsapp/inbound";
console.log("🔧 Development URL:");
console.log(`   ${devWebhookUrl}`);
console.log("");

// Production webhook URL (replace with actual domain)
console.log("🚀 Production URL:");
console.log(`   https://YOUR-DOMAIN.vercel.app/api/webhooks/whatsapp/inbound`);
console.log("");

console.log("⚙️ Webhook Settings:");
console.log("   • Events: ✅ Message Received");
console.log("   • Events: ✅ Message Status (optional)");
console.log(`   • Token: ${process.env.ULTRAMSG_WEBHOOK_TOKEN}`);
console.log("");

console.log("🧪 Test Configuration:");
console.log("1. Save webhook settings in UltraMessage");
console.log("2. Send a WhatsApp message to your business number");
console.log("3. Check your application logs for incoming webhook calls");
console.log("4. Verify conversation responses are sent back");
console.log("");

// Test UltraMessage API connection
async function testConnection() {
  try {
    console.log("🔍 Testing UltraMessage API Connection...");

    // Note: This is a placeholder test - replace with actual UltraMessage API endpoint
    const testUrl = `${ULTRAMSG_BASE_URL}/${ULTRAMSG_INSTANCE_ID}/instance/status`;
    console.log(`   Testing: ${testUrl}`);

    // For now, just show what the test would do
    console.log("   ℹ️ To test connection manually:");
    console.log(
      `   curl -X GET "${testUrl}" -H "Authorization: Bearer ${ULTRAMSG_TOKEN}"`
    );
    console.log("");

    console.log("✅ Configuration guide complete!");
  } catch (error) {
    console.log("❌ Connection test failed:", error.message);
  }
}

testConnection();

console.log("📞 Support:");
console.log("   • UltraMessage Documentation: https://docs.ultramsg.com/");
console.log("   • Webhook Troubleshooting: Check UltraMessage dashboard logs");
console.log("   • Local Testing: Use ngrok to expose localhost webhook");
