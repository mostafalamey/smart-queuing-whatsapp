import { NextRequest, NextResponse } from "next/server";
import { WhatsAppQRCodeService } from "@/lib/whatsapp-qr-service";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Generate WhatsApp QR codes for queue management
 * Supports organization, branch, department, and custom QR codes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, organizationId, branchId, departmentId, customMessage } =
      body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    let qrCodeDataURL: string;

    switch (type) {
      case "organization":
        qrCodeDataURL = await WhatsAppQRCodeService.generateOrganizationQR(
          organizationId
        );
        break;

      case "branch":
        if (!branchId) {
          return NextResponse.json(
            { error: "branchId is required for branch QR code" },
            { status: 400, headers: corsHeaders }
          );
        }
        qrCodeDataURL = await WhatsAppQRCodeService.generateBranchQR(branchId);
        break;

      case "department":
        if (!departmentId) {
          return NextResponse.json(
            { error: "departmentId is required for department QR code" },
            { status: 400, headers: corsHeaders }
          );
        }
        qrCodeDataURL = await WhatsAppQRCodeService.generateDepartmentQR(
          departmentId
        );
        break;

      case "custom":
        if (!customMessage) {
          return NextResponse.json(
            { error: "customMessage is required for custom QR code" },
            { status: 400, headers: corsHeaders }
          );
        }
        qrCodeDataURL = await WhatsAppQRCodeService.generateCustomQR(
          organizationId,
          customMessage
        );
        break;

      case "multiple":
        const multipleQRs = await WhatsAppQRCodeService.generateMultipleQRCodes(
          organizationId
        );
        return NextResponse.json(
          {
            success: true,
            type: "multiple",
            organizationId,
            qrCodes: multipleQRs,
          },
          { headers: corsHeaders }
        );

      default:
        return NextResponse.json(
          {
            error:
              "Invalid QR code type. Use: organization, branch, department, custom, or multiple",
          },
          { status: 400, headers: corsHeaders }
        );
    }

    return NextResponse.json(
      {
        success: true,
        type,
        organizationId,
        branchId,
        departmentId,
        qrCode: qrCodeDataURL,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ QR code generation error:", error);
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
 * Test WhatsApp link configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId query parameter is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const linkTest = await WhatsAppQRCodeService.testWhatsAppLink(
      organizationId
    );

    return NextResponse.json(
      {
        success: true,
        organizationId,
        linkTest,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ WhatsApp link test error:", error);
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
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
