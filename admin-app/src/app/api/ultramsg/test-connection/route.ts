import { NextRequest, NextResponse } from "next/server";
import { UltraMessageInstanceManager } from "@/lib/ultramsg-instance-manager";

export async function POST(request: NextRequest) {
  try {
    const { instanceId, token, baseUrl } = await request.json();

    if (!instanceId || !token) {
      return NextResponse.json(
        { success: false, message: "Instance ID and token are required" },
        { status: 400 }
      );
    }

    const instanceManager = new UltraMessageInstanceManager();
    const result = await instanceManager.testConnection(
      instanceId,
      token,
      baseUrl || "https://api.ultramsg.com"
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error testing UltraMessage connection:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
