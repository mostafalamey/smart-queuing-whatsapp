import { NextRequest, NextResponse } from "next/server";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Debug webhook endpoint - logs everything UltraMessage sends
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Webhook received from UltraMessage");
    console.log("🔍 Headers:", Object.fromEntries(request.headers.entries()));

    const rawBody = await request.text();
    console.log("🔍 Raw body:", rawBody);

    try {
      const jsonBody = JSON.parse(rawBody);
      console.log("🔍 Parsed JSON:", JSON.stringify(jsonBody, null, 2));
    } catch (e) {
      console.log("🔍 Body is not JSON");
    }

    return NextResponse.json(
      { success: true, message: "Debug webhook received" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("🔍 Debug webhook error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { status: "Debug webhook is running" },
    { headers: corsHeaders }
  );
}
