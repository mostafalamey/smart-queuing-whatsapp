// Enhanced Queue Operations with Conflict Resolution
// Handles database conflicts and race conditions for admin queue management

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { whatsappNotificationService } from "./whatsapp-notification-service";

interface TicketUpdateResult {
  success: boolean;
  ticket?: any;
  error?: string;
  shouldRetry?: boolean;
}

export class RobustQueueOperations {
  /**
   * Call next ticket with conflict resolution and retry logic
   */
  static async callNextWithConflictResolution(
    selectedDepartment: string,
    userProfile: any,
    organization: any,
    maxRetries: number = 3
  ): Promise<TicketUpdateResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.log(
          `Attempting to call next ticket (attempt ${attempt}/${maxRetries})`
        );

        // Start a transaction-like sequence
        const result = await this.performCallNextOperation(
          selectedDepartment,
          userProfile,
          organization
        );

        if (result.success) {
          logger.log("Call next operation completed successfully");
          return result;
        }

        // Check if this is a retryable error
        if (result.shouldRetry && attempt < maxRetries) {
          logger.log(`Operation failed but retryable, waiting before retry...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Progressive delay
          continue;
        }

        return result;
      } catch (error: any) {
        logger.error(`Call next attempt ${attempt} failed:`, error);

        // Check if this is a conflict error
        const isConflict =
          error.message?.includes("conflict") ||
          error.code === "PGRST204" ||
          error.code === "PGRST409";

        if (isConflict && attempt < maxRetries) {
          logger.log("Detected conflict, retrying with progressive delay...");
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        return {
          success: false,
          error: error.message || "Unknown error occurred",
          shouldRetry: false,
        };
      }
    }

    return {
      success: false,
      error: "Maximum retry attempts exceeded",
      shouldRetry: false,
    };
  }

  /**
   * Perform the actual call next operation
   */
  private static async performCallNextOperation(
    selectedDepartment: string,
    userProfile: any,
    organization: any
  ): Promise<TicketUpdateResult> {
    // Step 1: Get next waiting ticket with a timestamp check to prevent race conditions
    const { data: nextTickets } = await supabase
      .from("tickets")
      .select("*")
      .eq("department_id", selectedDepartment)
      .eq("status", "waiting")
      .order("created_at", { ascending: true })
      .limit(1);

    const nextTicket = nextTickets?.[0];
    if (!nextTicket) {
      return {
        success: false,
        error: "No waiting customers in queue",
      };
    }

    // Debug: Log the ticket data to see if customer_phone is present
    logger.log("Next ticket retrieved:", {
      id: nextTicket.id,
      ticket_number: nextTicket.ticket_number,
      customer_phone: nextTicket.customer_phone,
      status: nextTicket.status,
      department_id: nextTicket.department_id,
    });

    // Step 2: Try to atomically update the ticket status
    const now = new Date().toISOString();

    // Use a conditional update to prevent race conditions
    const { data: updatedTicket, error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "serving",
        called_at: now,
        updated_at: now,
      })
      .eq("id", nextTicket.id)
      .eq("status", "waiting") // Only update if still waiting
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating ticket to serving:", updateError);

      // Check if this was a conflict (ticket was already updated)
      if (updateError.code === "PGRST116") {
        return {
          success: false,
          error: "Ticket was already called by another user",
          shouldRetry: true,
        };
      }

      return {
        success: false,
        error: updateError.message,
        shouldRetry: true,
      };
    }

    if (!updatedTicket) {
      return {
        success: false,
        error: "Ticket may have already been called",
        shouldRetry: true,
      };
    }

    // Step 3: Mark any other currently serving tickets as completed
    // (This handles edge cases where multiple tickets might be serving)
    try {
      await supabase
        .from("tickets")
        .update({
          status: "completed",
          updated_at: now,
        })
        .eq("department_id", selectedDepartment)
        .eq("status", "serving")
        .neq("id", updatedTicket.id); // Don't update the ticket we just set to serving
    } catch (cleanupError) {
      logger.warn(
        "Warning: Could not clean up other serving tickets:",
        cleanupError
      );
      // Don't fail the operation for this
    }

    // Step 4: Update queue settings with retry logic
    const maxQueueRetries = 3;
    let queueUpdateSuccess = false;

    for (let i = 0; i < maxQueueRetries; i++) {
      try {
        // Try a conditional update first
        const { error: updateError } = await supabase
          .from("queue_settings")
          .update({
            current_serving: updatedTicket.ticket_number,
            updated_at: now,
          })
          .eq("department_id", selectedDepartment);

        if (!updateError) {
          queueUpdateSuccess = true;
          break;
        }

        // If update failed, try upsert
        const { error: upsertError } = await supabase
          .from("queue_settings")
          .upsert(
            {
              department_id: selectedDepartment,
              current_serving: updatedTicket.ticket_number,
              updated_at: now,
            },
            {
              onConflict: "department_id",
            }
          );

        if (!upsertError) {
          queueUpdateSuccess = true;
          break;
        }

        logger.warn(
          `Queue settings update attempt ${i + 1} failed:`,
          upsertError
        );

        if (i < maxQueueRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200 * (i + 1))); // Progressive delay
        }
      } catch (error) {
        logger.warn(`Queue settings update attempt ${i + 1} error:`, error);

        if (i === maxQueueRetries - 1) {
          throw error;
        }
      }
    }

    if (!queueUpdateSuccess) {
      logger.error("All queue settings update attempts failed");

      // Try to revert the ticket status
      try {
        await supabase
          .from("tickets")
          .update({
            status: "waiting",
            called_at: null,
            updated_at: now,
          })
          .eq("id", updatedTicket.id);
      } catch (revertError) {
        logger.error("Failed to revert ticket status:", revertError);
      }

      return {
        success: false,
        error: "Failed to update queue settings after multiple attempts",
        shouldRetry: true,
      };
    }

    return {
      success: true,
      ticket: updatedTicket,
    };
  }

  /**
   * Send WhatsApp notifications for called ticket
   */
  static async sendTicketNotifications(
    ticket: any,
    selectedDepartment: string,
    userProfile: any,
    organization: any,
    queueData: any
  ): Promise<void> {
    try {
      if (!userProfile?.organization_id) {
        logger.error("Organization ID not found for notifications");
        return;
      }

      if (!ticket.customer_phone) {
        logger.warn("No phone number found for ticket, skipping notifications");
        return;
      }

      // Fetch service name if ticket has service_id
      let serviceName = "General Service";
      if (ticket.service_id) {
        try {
          const { data: service } = await supabase
            .from("services")
            .select("name")
            .eq("id", ticket.service_id)
            .single();

          if (service) {
            serviceName = service.name;
          }
        } catch (serviceError) {
          logger.warn("Failed to fetch service name:", serviceError);
        }
      }

      logger.info("Sending WhatsApp notifications for called ticket:", {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        phone: ticket.customer_phone?.substring(0, 5) + "****", // Hide phone for privacy
        departmentName: queueData.department?.name,
        organizationName: organization?.name,
        organizationId: userProfile.organization_id,
        serviceName: serviceName,
      });

      // 1. Send "Your Turn" notification to the customer being called
      try {
        const success = await whatsappNotificationService.notifyYourTurn(
          ticket.customer_phone,
          ticket.ticket_number,
          queueData.department?.name || "Department",
          serviceName,
          organization?.name || "Organization",
          userProfile.organization_id
        );

        if (success) {
          logger.info("Successfully sent 'Your Turn' WhatsApp notification");
        } else {
          logger.warn("Failed to send 'Your Turn' WhatsApp notification");
        }
      } catch (yourTurnError) {
        logger.error(
          "Error sending 'Your Turn' WhatsApp notification:",
          yourTurnError
        );
      }

      // 2. Send "Almost Your Turn" notification to next customer
      try {
        // Get next customer in line
        const { data: upcomingTickets } = await supabase
          .from("tickets")
          .select("*")
          .eq("department_id", selectedDepartment)
          .eq("status", "waiting")
          .order("created_at", { ascending: true })
          .limit(1);

        if (upcomingTickets && upcomingTickets.length > 0) {
          const nextCustomer = upcomingTickets[0];

          if (nextCustomer.customer_phone) {
            // Fetch service name for next customer if they have service_id
            let nextServiceName = "General Service";
            if (nextCustomer.service_id) {
              try {
                const { data: nextService } = await supabase
                  .from("services")
                  .select("name")
                  .eq("id", nextCustomer.service_id)
                  .single();

                if (nextService) {
                  nextServiceName = nextService.name;
                }
              } catch (serviceError) {
                logger.warn(
                  "Failed to fetch service name for next customer:",
                  serviceError
                );
              }
            }

            const success =
              await whatsappNotificationService.notifyAlmostYourTurn(
                nextCustomer.customer_phone,
                nextCustomer.ticket_number,
                queueData.department?.name || "Department",
                nextServiceName,
                organization?.name || "Organization",
                userProfile.organization_id,
                ticket.ticket_number // Currently serving ticket
              );

            if (success) {
              logger.info(
                "Successfully sent 'Almost Your Turn' WhatsApp notification to next customer"
              );
            } else {
              logger.warn(
                "Failed to send 'Almost Your Turn' WhatsApp notification"
              );
            }
          } else {
            logger.warn(
              "Next customer has no phone number, skipping 'Almost Your Turn' notification"
            );
          }
        } else {
          logger.info(
            "No more customers in queue, skipping 'Almost Your Turn' notification"
          );
        }
      } catch (almostYourTurnError) {
        logger.warn(
          "Error sending 'Almost Your Turn' notification (non-critical):",
          almostYourTurnError
        );
        // Don't fail the main operation for this
      }
    } catch (notificationError) {
      logger.error("Notification process failed:", notificationError);
      // Don't fail the main queue operation for notification failures
    }
  }
}
