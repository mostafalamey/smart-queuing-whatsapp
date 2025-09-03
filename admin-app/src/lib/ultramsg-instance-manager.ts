/**
 * UltraMessage Instance Manager
 *
 * Handles organization-specific UltraMessage instances for multi-tenant WhatsApp support.
 * Each organization has its own UltraMessage instance with unique credentials.
 */

import { createClient } from "@supabase/supabase-js";
import {
  Organization,
  UltraMessageConfig,
  UltraMessageTestResult,
} from "@/app/organization/features/shared/types";

// Use regular client for client-side operations, service role only on server
const getSupabaseClient = () => {
  // Check if we're on the server side and have service role key
  if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Client side - use anon key
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export class UltraMessageInstanceManager {
  private static instance: UltraMessageInstanceManager;

  static getInstance(): UltraMessageInstanceManager {
    if (!UltraMessageInstanceManager.instance) {
      UltraMessageInstanceManager.instance = new UltraMessageInstanceManager();
    }
    return UltraMessageInstanceManager.instance;
  }

  /**
   * Get UltraMessage configuration for an organization
   */
  async getOrganizationConfig(
    organizationId: string
  ): Promise<UltraMessageConfig | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("organizations")
        .select(
          `
          ultramsg_instance_id,
          ultramsg_token,
          ultramsg_base_url,
          ultramsg_webhook_token,
          whatsapp_instance_status,
          ultramsg_last_tested,
          ultramsg_last_error,
          daily_message_limit,
          daily_message_count
        `
        )
        .eq("id", organizationId)
        .single();

      if (error || !data) {
        console.error(
          "Error fetching organization UltraMessage config:",
          error
        );
        return null;
      }

      if (!data.ultramsg_instance_id || !data.ultramsg_token) {
        console.log(
          `Organization ${organizationId} has no UltraMessage configuration`
        );
        return null;
      }

      return {
        instanceId: data.ultramsg_instance_id,
        token: data.ultramsg_token,
        baseUrl: data.ultramsg_base_url || "https://api.ultramsg.com",
        webhookToken: data.ultramsg_webhook_token || "",
        status: data.whatsapp_instance_status || "inactive",
        lastTested: data.ultramsg_last_tested,
        lastError: data.ultramsg_last_error,
        dailyLimit: data.daily_message_limit || 1000,
        dailyCount: data.daily_message_count || 0,
      };
    } catch (error) {
      console.error("Error in getOrganizationConfig:", error);
      return null;
    }
  }

  /**
   * Update UltraMessage configuration for an organization
   */
  async updateOrganizationConfig(
    organizationId: string,
    config: Partial<UltraMessageConfig>,
    testConnection: boolean = true
  ): Promise<{
    success: boolean;
    message: string;
    testResult?: UltraMessageTestResult;
  }> {
    try {
      // Test connection if requested
      let testResult: UltraMessageTestResult | undefined;
      if (testConnection && config.instanceId && config.token) {
        testResult = await this.testConnection(
          config.instanceId,
          config.token,
          config.baseUrl || "https://api.ultramsg.com"
        );

        if (!testResult.success) {
          return {
            success: false,
            message: "Connection test failed",
            testResult,
          };
        }
      }

      // Update database
      const updateData: any = {};

      if (config.instanceId)
        updateData.ultramsg_instance_id = config.instanceId;
      if (config.token) updateData.ultramsg_token = config.token; // TODO: Encrypt this
      if (config.baseUrl) updateData.ultramsg_base_url = config.baseUrl;
      if (config.webhookToken)
        updateData.ultramsg_webhook_token = config.webhookToken;
      if (config.status) updateData.whatsapp_instance_status = config.status;
      if (config.dailyLimit) updateData.daily_message_limit = config.dailyLimit;

      // Set test results
      if (testResult) {
        updateData.ultramsg_last_tested = new Date().toISOString();
        updateData.ultramsg_last_error = testResult.success
          ? null
          : testResult.message;
        updateData.whatsapp_instance_status = testResult.success
          ? "active"
          : "error";
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("organizations")
        .update(updateData)
        .eq("id", organizationId);

      if (error) {
        console.error("Error updating UltraMessage config:", error);
        return {
          success: false,
          message: "Database update failed",
        };
      }

      return {
        success: true,
        message: "UltraMessage configuration updated successfully",
        testResult,
      };
    } catch (error) {
      console.error("Error in updateOrganizationConfig:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Test UltraMessage instance connection
   */
  async testConnection(
    instanceId: string,
    token: string,
    baseUrl: string = "https://api.ultramsg.com"
  ): Promise<UltraMessageTestResult> {
    const startTime = Date.now();

    try {
      // Test the connection by attempting to send a test message to ourselves
      // We'll use a special test message that we won't actually send
      const url = `${baseUrl}/${instanceId}/messages/chat`;

      console.log(`Testing UltraMessage connection: ${instanceId}`);

      // Create a test request similar to successful message sending but with invalid recipient
      // This will test authentication and API availability without sending actual messages
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          token: token,
          to: "1234567890", // Invalid number to test API without sending actual messages
          body: "Connection Test",
          priority: "10", // Low priority
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
        };
      }

      const data = await response.json();

      // For test messages, we expect either:
      // 1. Success (even with invalid number) - means API is working
      // 2. Specific error about invalid number - means API is working but number is invalid (expected)
      // 3. Daily limit exceeded - means API is working but quota reached (expected for demo accounts)
      // 4. Authentication error - means credentials are wrong
      if (data.error) {
        // If the error is about invalid number format, that's actually success for our test
        if (
          data.error.toLowerCase().includes("invalid") ||
          data.error.toLowerCase().includes("number") ||
          data.error.toLowerCase().includes("format")
        ) {
          return {
            success: true,
            message: "Connection successful (API accessible)",
            details: {
              instanceId,
              testNote: "API responded correctly to test request",
              apiResponse: data,
            },
            responseTime,
          };
        }

        // If the error is about daily limit exceeded, that's also success for connection test
        if (
          data.error.toLowerCase().includes("daily limit exceeded") ||
          data.error.toLowerCase().includes("demo daily limit")
        ) {
          return {
            success: true,
            message: "Connection successful (Daily limit reached)",
            details: {
              instanceId,
              testNote:
                "API is working but daily message limit exceeded - this is normal for demo accounts",
              apiResponse: data,
            },
            responseTime,
          };
        }

        return {
          success: false,
          message: `UltraMessage API Error: ${data.error}`,
          details: data,
          responseTime,
        };
      }

      return {
        success: true,
        message: "Connection successful",
        details: {
          instanceId,
          testNote: "API test completed successfully",
          apiResponse: data,
        },
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error("UltraMessage connection test failed:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
        responseTime,
      };
    }
  }

  /**
   * Send WhatsApp message using organization-specific instance
   */
  async sendMessage(
    organizationId: string,
    phoneNumber: string,
    message: string,
    priority: string = "1"
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.getOrganizationConfig(organizationId);

      if (!config) {
        return {
          success: false,
          error: "No UltraMessage configuration found for organization",
        };
      }

      if (config.status !== "active") {
        return {
          success: false,
          error: `UltraMessage instance is ${config.status}`,
        };
      }

      // Check daily limit
      if (config.dailyCount >= config.dailyLimit) {
        return {
          success: false,
          error: "Daily message limit exceeded",
        };
      }

      // Clean phone number (remove + if present)
      const cleanPhone = phoneNumber.replace(/^\+/, "");

      const url = `${config.baseUrl}/${config.instanceId}/messages/chat`;

      console.log(
        `📤 Sending WhatsApp message via ${config.instanceId} to ${cleanPhone}`
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          token: config.token,
          to: cleanPhone,
          body: message,
          priority,
        }),
      });

      const responseData = await response.json();

      if (responseData.sent) {
        // Increment daily count
        await this.incrementMessageCount(organizationId);

        console.log(
          `✅ WhatsApp message sent successfully via ${config.instanceId}`
        );
        return {
          success: true,
          messageId: responseData.id,
        };
      } else {
        console.error(
          `❌ Failed to send WhatsApp message via ${config.instanceId}:`,
          responseData
        );
        return {
          success: false,
          error: responseData.error || "Unknown error",
        };
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get organization by WhatsApp business number
   */
  async getOrganizationByWhatsAppNumber(
    whatsappNumber: string
  ): Promise<{ id: string; name: string; config: UltraMessageConfig } | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("organizations")
        .select(
          `
          id,
          name,
          ultramsg_instance_id,
          ultramsg_token,
          ultramsg_base_url,
          ultramsg_webhook_token,
          whatsapp_instance_status,
          ultramsg_last_tested,
          ultramsg_last_error,
          daily_message_limit,
          daily_message_count
        `
        )
        .eq("whatsapp_business_number", whatsappNumber)
        .eq("whatsapp_instance_status", "active")
        .single();

      if (error || !data) {
        console.log(
          `No active organization found for WhatsApp number: ${whatsappNumber}`
        );
        return null;
      }

      if (!data.ultramsg_instance_id || !data.ultramsg_token) {
        console.log(
          `Organization ${data.id} has no UltraMessage configuration`
        );
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        config: {
          instanceId: data.ultramsg_instance_id,
          token: data.ultramsg_token,
          baseUrl: data.ultramsg_base_url || "https://api.ultramsg.com",
          webhookToken: data.ultramsg_webhook_token || "",
          status: data.whatsapp_instance_status || "inactive",
          lastTested: data.ultramsg_last_tested,
          lastError: data.ultramsg_last_error,
          dailyLimit: data.daily_message_limit || 1000,
          dailyCount: data.daily_message_count || 0,
        },
      };
    } catch (error) {
      console.error("Error in getOrganizationByWhatsAppNumber:", error);
      return null;
    }
  }

  /**
   * Increment daily message count for organization
   */
  private async incrementMessageCount(organizationId: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.rpc("increment_message_count", {
        org_id: organizationId,
      });

      if (error) {
        console.error("Error incrementing message count:", error);
      }
    } catch (error) {
      console.error("Error in incrementMessageCount:", error);
    }
  }
}
