import { NextRequest, NextResponse } from "next/server";

interface WhatsAppNotificationRequest {
  phone: string;
  ticketNumber: string;
  departmentName: string;
  organizationName: string;
  type: "ticket_created" | "almost_your_turn" | "your_turn";
  currentServing?: string;
  waitingCount?: number;
}

interface UltraMessageResponse {
  sent: boolean;
  message: string;
  id?: string;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

function formatMessage(data: WhatsAppNotificationRequest): string {
  const {
    ticketNumber,
    departmentName,
    organizationName,
    type,
    currentServing,
    waitingCount,
  } = data;

  switch (type) {
    case "ticket_created":
      return `🎫 Welcome to ${organizationName}!

Your ticket number: *${ticketNumber}*
Department: ${departmentName}

${
  waitingCount
    ? `There are ${waitingCount} customers ahead of you.`
    : "You'll be called soon!"
}

Please keep this message for reference. We'll notify you when it's almost your turn.

Thank you for choosing ${organizationName}! 🙏`;

    case "almost_your_turn":
      return `⏰ Almost your turn at ${organizationName}!

Your ticket: *${ticketNumber}*
Currently serving: ${currentServing}

You're next! Please be ready at the ${departmentName} counter.

Thank you for your patience! 🙏`;

    case "your_turn":
      return `🔔 It's your turn!

Ticket: *${ticketNumber}*
Please proceed to: ${departmentName}

Thank you for choosing ${organizationName}! 🙏`;

    default:
      return `Update for ticket ${ticketNumber} at ${organizationName}`;
  }
}

/**
 * Send WhatsApp notification via UltraMessage API
 * POST /api/notifications/whatsapp-direct
 */
export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppNotificationRequest = await request.json();
    const { phone, ticketNumber, departmentName, organizationName, type } =
      body;

    // Validate required fields
    if (
      !phone ||
      !ticketNumber ||
      !departmentName ||
      !organizationName ||
      !type
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: phone, ticketNumber, departmentName, organizationName, type",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if WhatsApp is enabled
    const whatsappEnabled = process.env.WHATSAPP_ENABLED === "true";
    const isDebugMode = process.env.WHATSAPP_DEBUG === "true";

    console.log("🔍 WhatsApp Direct API Request:", {
      phone: phone.substring(0, 5) + "****", // Hide full phone for privacy
      ticketNumber,
      departmentName,
      organizationName,
      type,
      whatsappEnabled,
      isDebugMode,
    });

    if (!whatsappEnabled) {
      console.log("WhatsApp is disabled, skipping message send");
      return NextResponse.json(
        {
          success: false,
          message: "WhatsApp notifications are disabled",
          debug: "Set WHATSAPP_ENABLED=true in environment variables",
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // Get UltraMessage configuration
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    const baseUrl = process.env.ULTRAMSG_BASE_URL || "https://api.ultramsg.com";

    console.log("🔧 WhatsApp Configuration:", {
      instanceId: instanceId || "MISSING",
      hasToken: !!token,
      baseUrl,
      whatsappEnabled,
      isDebugMode,
    });

    if (!instanceId || !token) {
      console.error("UltraMessage configuration missing");
      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp API configuration incomplete",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Format phone number (remove + and ensure it starts with country code)
    const formattedPhone = phone.startsWith("+") ? phone.substring(1) : phone;
    const message = formatMessage(body);

    if (isDebugMode) {
      console.log("🔍 WhatsApp Debug Mode - Would send message:", {
        phone: formattedPhone,
        message: message.substring(0, 100) + "...",
        type,
        ticketNumber,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Message sent successfully (DEBUG MODE)",
          debug: {
            phone: formattedPhone,
            messageLength: message.length,
            instanceId,
            endpoint: `${baseUrl}/${instanceId}/messages/chat`,
            type,
            ticketNumber,
          },
        },
        { headers: corsHeaders }
      );
    }

    // Send message via UltraMessage API
    const ultraMessageUrl = `${baseUrl}/${instanceId}/messages/chat`;

    console.log("📱 Sending WhatsApp message via UltraMessage:", {
      phone: formattedPhone,
      endpoint: ultraMessageUrl,
      messageLength: message.length,
      type,
      ticketNumber,
    });

    const response = await fetch(ultraMessageUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: token,
        to: formattedPhone,
        body: message,
        priority: "1", // High priority
        referenceId: `${type}-${ticketNumber}-${Date.now()}`,
      }),
    });

    const responseText = await response.text();
    let responseData: UltraMessageResponse;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse UltraMessage response:", responseText);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from WhatsApp service",
          details: responseText,
        },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!response.ok) {
      console.error("UltraMessage API error:", {
        status: response.status,
        statusText: response.statusText,
        responseData,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to send WhatsApp message",
          details: responseData,
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    // Check if message was sent successfully
    if (responseData.sent) {
      console.log("✅ WhatsApp message sent successfully:", {
        phone: formattedPhone,
        messageId: responseData.id,
        type,
        ticketNumber,
      });

      return NextResponse.json(
        {
          success: true,
          message: "WhatsApp message sent successfully",
          messageId: responseData.id,
          phone: formattedPhone,
          type,
          ticketNumber,
        },
        { headers: corsHeaders }
      );
    } else {
      console.error("UltraMessage reported message not sent:", responseData);
      console.error("Full UltraMessage response:", responseText);
      console.error("Request details:", {
        phone: formattedPhone,
        type,
        ticketNumber,
        messageLength: message.length,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Message was not sent",
          details: responseData.message || "Unknown error",
          ultraMessageResponse: responseData,
        },
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("WhatsApp Direct API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Get WhatsApp service status
 * GET /api/notifications/whatsapp-direct
 */
export async function GET() {
  try {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    const whatsappEnabled = process.env.WHATSAPP_ENABLED === "true";
    const isDebugMode = process.env.WHATSAPP_DEBUG === "true";

    return NextResponse.json(
      {
        enabled: whatsappEnabled,
        debugMode: isDebugMode,
        configured: !!(instanceId && token),
        instanceId: instanceId || null,
        endpoint: instanceId ? `https://api.ultramsg.com/${instanceId}` : null,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get service status" },
      { status: 500, headers: corsHeaders }
    );
  }
}
