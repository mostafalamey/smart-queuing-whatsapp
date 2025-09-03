/**
 * WhatsApp-Only Notification Service
 *
 * Simplified notification service for WhatsApp-first queue system.
 * Directly sends WhatsApp messages via UltraMessage API without
 * session checking or customer app dependencies.
 */

import { logger } from "@/lib/logger";

interface WhatsAppNotificationData {
  phone: string;
  ticketNumber: string;
  departmentName: string;
  organizationName: string;
  type: "ticket_created" | "almost_your_turn" | "your_turn";
  currentServing?: string;
  waitingCount?: number;
}

class WhatsAppNotificationService {
  private static instance: WhatsAppNotificationService;

  static getInstance(): WhatsAppNotificationService {
    if (!WhatsAppNotificationService.instance) {
      WhatsAppNotificationService.instance = new WhatsAppNotificationService();
    }
    return WhatsAppNotificationService.instance;
  }

  /**
   * Send WhatsApp message via server-side API endpoint
   * This ensures environment variables are accessible
   */
  async sendWhatsAppMessage(data: WhatsAppNotificationData): Promise<boolean> {
    try {
      logger.info(`Sending WhatsApp message via API:`, {
        phone: data.phone.substring(0, 5) + "****",
        type: data.type,
        ticketNumber: data.ticketNumber,
        departmentName: data.departmentName,
      });

      // Use absolute URL for API calls in production (Vercel serverless environment)
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
      const apiUrl = `${baseUrl}/api/notifications/whatsapp-direct`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: data.phone,
          ticketNumber: data.ticketNumber,
          departmentName: data.departmentName,
          organizationName: data.organizationName,
          type: data.type,
          currentServing: data.currentServing,
          waitingCount: data.waitingCount,
        }),
      });

      const result = await response.json();

      console.log("🔍 WhatsApp Direct API response:", {
        ok: response.ok,
        status: response.status,
        success: result.success,
        message: result.message,
        error: result.error,
        type: data.type,
        ticketNumber: data.ticketNumber,
      });

      if (!response.ok || !result.success) {
        logger.error("WhatsApp Direct API error:", result);
        return false;
      }

      logger.info("WhatsApp message sent successfully via API:", {
        phone: data.phone.substring(0, 5) + "****",
        messageId: result.messageId,
        type: data.type,
        ticketNumber: data.ticketNumber,
      });

      return true;
    } catch (error) {
      logger.error("Failed to send WhatsApp message via API:", error);
      return false;
    }
  }

  // Helper method to send ticket creation notification
  async notifyTicketCreated(
    phone: string,
    ticketNumber: string,
    departmentName: string,
    organizationName: string,
    waitingCount?: number
  ): Promise<boolean> {
    return this.sendWhatsAppMessage({
      phone,
      ticketNumber,
      departmentName,
      organizationName,
      type: "ticket_created",
      waitingCount,
    });
  }

  // Helper method to send "almost your turn" notification
  async notifyAlmostYourTurn(
    phone: string,
    ticketNumber: string,
    departmentName: string,
    organizationName: string,
    currentServing: string
  ): Promise<boolean> {
    return this.sendWhatsAppMessage({
      phone,
      ticketNumber,
      departmentName,
      organizationName,
      type: "almost_your_turn",
      currentServing,
    });
  }

  // Helper method to send "your turn" notification
  async notifyYourTurn(
    phone: string,
    ticketNumber: string,
    departmentName: string,
    organizationName: string
  ): Promise<boolean> {
    return this.sendWhatsAppMessage({
      phone,
      ticketNumber,
      departmentName,
      organizationName,
      type: "your_turn",
    });
  }
}

export const whatsappNotificationService =
  WhatsAppNotificationService.getInstance();
