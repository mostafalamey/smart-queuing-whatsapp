/**
 * WhatsApp Message Template Workflow Test
 * Tests the entire customer journey with new message templates
 */

const ADMIN_URL = "http://localhost:3001";
const TEST_PHONE = "+201234567890"; // Test phone number
const TEST_ORG_ID = "test-org-id"; // Replace with your actual org ID

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWhatsAppMessage(phone, message, orgId) {
  try {
    console.log(`📱 Sending WhatsApp message to ${phone}: "${message}"`);

    const response = await fetch(`${ADMIN_URL}/api/webhooks/whatsapp/inbound`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "message_received",
        instanceId: process.env.ULTRAMSG_INSTANCE_ID || "test-instance",
        id: `msg-${Date.now()}`,
        referenceId: `ref-${Date.now()}`,
        hash: `hash-${Date.now()}`,
        data: {
          id: `msg-${Date.now()}`,
          sid: `sid-${Date.now()}`,
          from: phone.replace("+", "") + "@c.us",
          to:
            (process.env.WHATSAPP_BUSINESS_NUMBER || "201015544028") + "@c.us",
          author: phone.replace("+", "") + "@c.us",
          pushname: "Test User",
          ack: "2",
          type: "chat",
          body: message,
          media: "",
          fromMe: false,
          self: false,
          isForwarded: false,
          isMentioned: false,
          quotedMsg: {},
          mentionedIds: [],
          time: Math.floor(Date.now() / 1000),
        },
      }),
    });

    const result = await response.text();
    console.log(`✅ Response:`, result);
    console.log("---");

    return result;
  } catch (error) {
    console.error("❌ Error sending message:", error.message);
    return null;
  }
}

async function testMessageTemplates() {
  console.log("🚀 Starting WhatsApp Message Template Workflow Test\n");
  console.log("📋 This test will simulate a complete customer journey:");
  console.log("1. Initial contact with QR code message");
  console.log("2. Welcome message response");
  console.log("3. Branch/Department/Service selection");
  console.log("4. Ticket confirmation");
  console.log("5. Status updates\n");

  // Test 1: Initial contact (QR code message)
  console.log("=== TEST 1: QR Code Message ===");
  await sendWhatsAppMessage(
    TEST_PHONE,
    "Hello HYPER1! I would like to join the queue.",
    TEST_ORG_ID
  );
  await delay(2000);

  // Test 2: Branch selection (if multiple branches)
  console.log("=== TEST 2: Branch Selection ===");
  await sendWhatsAppMessage(TEST_PHONE, "1", TEST_ORG_ID);
  await delay(2000);

  // Test 3: Department selection
  console.log("=== TEST 3: Department Selection ===");
  await sendWhatsAppMessage(TEST_PHONE, "1", TEST_ORG_ID);
  await delay(2000);

  // Test 4: Service selection
  console.log("=== TEST 4: Service Selection ===");
  await sendWhatsAppMessage(TEST_PHONE, "1", TEST_ORG_ID);
  await delay(2000);

  // Test 5: Check status
  console.log("=== TEST 5: Status Check ===");
  await sendWhatsAppMessage(TEST_PHONE, "status", TEST_ORG_ID);
  await delay(2000);

  // Test 6: Invalid input
  console.log("=== TEST 6: Invalid Input ===");
  await sendWhatsAppMessage(TEST_PHONE, "xyz", TEST_ORG_ID);
  await delay(2000);

  // Test 7: Restart conversation
  console.log("=== TEST 7: Restart Conversation ===");
  await sendWhatsAppMessage(TEST_PHONE, "restart", TEST_ORG_ID);
  await delay(2000);

  console.log("✅ WhatsApp Message Template Workflow Test Complete!");
  console.log("\n📊 Check your console logs for WhatsApp debug messages");
  console.log(
    "🔍 Look for processed message templates with replaced variables"
  );
}

async function testMessageTemplateAPI() {
  console.log("🧪 Testing Message Template API Endpoints\n");

  // Test fetching message templates
  try {
    console.log("=== Testing Template Fetch ===");
    const response = await fetch(`${ADMIN_URL}/api/message-templates`, {
      method: "GET",
      headers: {
        Authorization: "Bearer your-test-token", // You might need to add auth
      },
    });

    if (response.ok) {
      const templates = await response.json();
      console.log("✅ Message templates fetched:", Object.keys(templates));
    } else {
      console.log("⚠️ Template API not available or requires auth");
    }
  } catch (error) {
    console.log("⚠️ Template API test skipped:", error.message);
  }
}

// Run the tests
(async () => {
  try {
    console.log(
      "🔧 WhatsApp Debug Mode:",
      process.env.WHATSAPP_DEBUG === "true" ? "ENABLED" : "DISABLED"
    );
    console.log(
      "📱 Business Number:",
      process.env.WHATSAPP_BUSINESS_NUMBER || "Not set"
    );
    console.log("🌐 Admin URL:", ADMIN_URL);
    console.log("");

    // Test message templates first
    await testMessageTemplateAPI();
    await delay(1000);

    // Then test the full workflow
    await testMessageTemplates();

    console.log("\n🎉 All tests completed!");
    console.log("\n💡 Tips for checking results:");
    console.log("1. Check admin app console for WhatsApp debug logs");
    console.log("2. Check Supabase dashboard for conversation records");
    console.log("3. Verify message templates are loaded and processed");
    console.log("4. Look for variable replacements in debug output");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
})();
