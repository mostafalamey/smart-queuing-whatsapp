import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WhatsAppConversationEngine } from "../../../../../lib/whatsapp-conversation-engine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface UltraMessageWebhookPayload {
  event_type: string;
  instanceId: string;
  id: string;
  referenceId: string;
  hash: string;
  data: {
    id: string;
    sid: string;
    from: string;
    to: string;
    author: string;
    pushname: string;
    ack: string;
    type: string;
    body: string;
    media: string;
    fromMe: boolean;
    self: boolean;
    isForwarded: boolean;
    isMentioned: boolean;
    quotedMsg: object;
    mentionedIds: string[];
    time: number;
  };
}

/**
 * Enhanced WhatsApp Webhook for Conversational Queue Management
 * Processes incoming WhatsApp messages and manages customer conversations
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📨 WhatsApp webhook received");

    const payload: UltraMessageWebhookPayload = await request.json();
    console.log("📋 Webhook payload:", JSON.stringify(payload, null, 2));

    // UltraMessage sends single message events, not arrays
    // Handle both message_create and message_received events
    if (
      !payload.data ||
      !["message_create", "message_received"].includes(payload.event_type)
    ) {
      console.error(
        `❌ Invalid webhook payload structure or event type: ${payload.event_type}`
      );
      return NextResponse.json(
        { error: "Invalid payload structure or event type" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Skip messages sent by us (fromMe: true) - only process received messages
    if (payload.data.fromMe) {
      console.log("⏭️ Skipping message sent by us (fromMe: true)");
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          reason: "Message sent by instance owner",
        },
        { headers: corsHeaders }
      );
    }

    // Process the single message
    const conversationEngine = new WhatsAppConversationEngine(supabase);

    try {
      const response = await processWhatsAppMessage(
        payload.data,
        conversationEngine
      );

      return NextResponse.json(
        {
          success: true,
          processed: 1,
          response,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error(`❌ Error processing message ${payload.data.id}:`, error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("❌ WhatsApp webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Process individual WhatsApp message from UltraMessage format
 */
async function processWhatsAppMessage(
  messageData: any,
  conversationEngine: WhatsAppConversationEngine
) {
  console.log(
    `📱 Processing message from ${messageData.from}: "${messageData.body}"`
  );

  // Only process chat messages for now
  if (messageData.type !== "chat") {
    console.log(`⏭️ Skipping non-chat message type: ${messageData.type}`);
    return {
      messageId: messageData.id,
      success: true,
      skipped: true,
      reason: `Unsupported message type: ${messageData.type}`,
    };
  }

  // Extract phone number from UltraMessage format (remove @c.us suffix)
  const fromPhone = messageData.from.replace("@c.us", "");
  const toPhone = messageData.to.replace("@c.us", "");

  // Get organization from business number
  const organizationData = await getOrganizationByWhatsAppNumber(toPhone);

  if (!organizationData) {
    console.error(`❌ No organization found for WhatsApp number: ${toPhone}`);

    // Send error message to customer
    await sendWhatsAppResponse(
      fromPhone,
      "Sorry, this WhatsApp number is not associated with any organization. Please check the number and try again."
    );

    return {
      messageId: messageData.id,
      success: false,
      error: "Organization not found",
    };
  }

  // Extract QR code context from message if it's an initial contact
  const qrContext = extractQRContext(messageData.body);

  // Process conversation with QR context
  const responseMessage = await conversationEngine.processMessage(
    fromPhone,
    messageData.body,
    organizationData.id,
    qrContext?.branchId,
    qrContext?.departmentId
  );

  // Send response to customer
  const sendResult = await sendWhatsAppResponse(fromPhone, responseMessage);

  // Log the interaction
  await logWhatsAppInteraction({
    messageId: messageData.id,
    phoneNumber: fromPhone,
    organizationId: organizationData.id,
    inboundMessage: messageData.body,
    outboundMessage: responseMessage,
    success: sendResult.success,
    qrContext,
  });

  return {
    messageId: messageData.id,
    success: sendResult.success,
    phoneNumber: fromPhone,
    responseMessage,
    sendResult,
  };
}

/**
 * Get organization ID by WhatsApp business number
 */
async function getOrganizationByWhatsAppNumber(
  whatsappNumber: string
): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("whatsapp_business_number", whatsappNumber)
    .single();

  if (error) {
    console.error("Error fetching organization by WhatsApp number:", error);
    return null;
  }

  return data || null;
}

/**
 * Extract QR code context from initial message
 */
function extractQRContext(
  messageBody: string
): { branchId?: string; departmentId?: string } | null {
  // Look for branch/department context in the initial message
  // This could be embedded in the QR code message template
  // For now, we'll return null and let the conversation engine handle the flow
  // In production, you might embed this in the QR message template like:
  // "Hello [Organization]! Branch: [BranchID], Department: [DeptID]"

  return null; // No QR context extraction for now - relies on conversation flow
}

/**
 * Send WhatsApp response using UltraMessage API
 */
async function sendWhatsAppResponse(phoneNumber: string, message: string) {
  try {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    const baseUrl = process.env.ULTRAMSG_BASE_URL || "https://api.ultramsg.com";

    if (!instanceId || !token) {
      throw new Error("UltraMessage configuration missing");
    }

    // Clean phone number (remove + if present)
    const cleanPhone = phoneNumber.replace(/^\+/, "");

    const url = `${baseUrl}/${instanceId}/messages/chat`;

    console.log(`📤 Sending WhatsApp response to ${cleanPhone}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token,
        to: cleanPhone,
        body: message,
        priority: "1",
      }),
    });

    const responseData = await response.json();

    if (responseData.sent) {
      console.log(`✅ WhatsApp message sent successfully to ${cleanPhone}`);
      return {
        success: true,
        messageId: responseData.id,
        phone: cleanPhone,
      };
    } else {
      console.error(`❌ Failed to send WhatsApp message:`, responseData);
      return {
        success: false,
        error: responseData.error || "Unknown error",
        phone: cleanPhone,
      };
    }
  } catch (error) {
    console.error("❌ Error sending WhatsApp response:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      phone: phoneNumber,
    };
  }
}

/**
 * Log WhatsApp interaction for analytics and debugging
 */
async function logWhatsAppInteraction(data: {
  messageId: string;
  phoneNumber: string;
  organizationId: string;
  inboundMessage: string;
  outboundMessage: string;
  success: boolean;
  qrContext?: { branchId?: string; departmentId?: string } | null;
}) {
  try {
    const { error } = await supabase.from("whatsapp_inbound_messages").insert({
      id: data.messageId,
      phone_number: data.phoneNumber,
      message_content: data.inboundMessage,
      organization_id: data.organizationId,
      processed: true,
      webhook_data: {
        outbound_message: data.outboundMessage,
        send_success: data.success,
        qr_context: data.qrContext,
        processed_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("Error logging WhatsApp interaction:", error);
    }
  } catch (error) {
    console.error("Error logging WhatsApp interaction:", error);
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
