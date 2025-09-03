/**
 * Quick database update script for WhatsApp configuration
 * Run this to configure your organization with WhatsApp business number
 */

// Load environment variables first
require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Environment check:");
console.log("SUPABASE_URL:", supabaseUrl ? "Found" : "Missing");
console.log("SERVICE_KEY:", supabaseServiceKey ? "Found" : "Missing");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in environment variables");
  console.log("Please ensure .env.local file exists with:");
  console.log("NEXT_PUBLIC_SUPABASE_URL=...");
  console.log("SUPABASE_SERVICE_ROLE_KEY=...");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateOrganization() {
  try {
    console.log("🔍 Checking existing organizations...");

    // First, get all organizations
    const { data: orgs, error: fetchError } = await supabase
      .from("organizations")
      .select("id, name, whatsapp_business_number");

    if (fetchError) {
      console.error("Error fetching organizations:", fetchError);
      return;
    }

    console.log("📋 Found organizations:");
    orgs.forEach((org) => {
      console.log(`  - ${org.name} (ID: ${org.id})`);
      console.log(
        `    WhatsApp Number: ${
          org.whatsapp_business_number || "Not configured"
        }`
      );
    });

    console.log("\n🔧 Updating organizations with WhatsApp configuration...");

    // Update all organizations with WhatsApp business number
    const { data: updateData, error: updateError } = await supabase
      .from("organizations")
      .update({
        whatsapp_business_number: "201015544028",
        qr_code_message_template:
          "Hello! I would like to join the queue for {{organization_name}}.",
      })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all real organizations

    if (updateError) {
      console.error("❌ Error updating organizations:", updateError);
      return;
    }

    console.log(
      "✅ Successfully updated organizations with WhatsApp configuration!"
    );

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from("organizations")
      .select("id, name, whatsapp_business_number, qr_code_message_template")
      .not("whatsapp_business_number", "is", null);

    if (verifyError) {
      console.error("Error verifying update:", verifyError);
      return;
    }

    console.log("\n📱 Organizations now configured for WhatsApp:");
    verifyData.forEach((org) => {
      console.log(`  ✓ ${org.name}`);
      console.log(`    WhatsApp: ${org.whatsapp_business_number}`);
      console.log(`    Template: ${org.qr_code_message_template}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run if called directly
if (require.main === module) {
  updateOrganization();
}

module.exports = { updateOrganization };
