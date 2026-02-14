import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { whatsappNotificationService } from "@/lib/whatsapp-notification-service";
import { TransferTicketResult } from "@/types/database";

export interface TransferDestination {
  serviceId: string;
  serviceName: string;
  departmentId: string;
  departmentName: string;
  branchId: string;
  branchName: string;
  estimatedTime: number | null;
  waitingCount: number;
}

export interface TransferTicketParams {
  ticketId: string;
  toServiceId: string;
  transferReason?: string;
  transferNotes?: string;
}

export interface TransferContext {
  organizationId: string;
  organizationName: string;
  currentServiceName: string;
  currentDepartmentName: string;
}

export const useTransferTicket = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [destinations, setDestinations] = useState<TransferDestination[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);

  /**
   * Fetch available transfer destinations for the organization
   * Excludes the current service the ticket is in
   */
  const fetchTransferDestinations = useCallback(
    async (
      organizationId: string,
      currentServiceId: string,
    ): Promise<TransferDestination[]> => {
      if (!organizationId) return [];

      setIsLoadingDestinations(true);
      try {
        // Fetch all active services in the organization with their departments and branches
        const { data: services, error } = await supabase
          .from("services")
          .select(
            `
            id,
            name,
            estimated_time,
            department_id,
            departments!inner (
              id,
              name,
              is_active,
              branch_id,
              branches!inner (
                id,
                name,
                organization_id
              )
            )
          `,
          )
          .eq("is_active", true)
          .eq("departments.is_active", true)
          .neq("id", currentServiceId);

        if (error) throw error;

        // Filter by organization and transform the data
        const filteredServices = (services || []).filter(
          (service: any) =>
            service.departments?.branches?.organization_id === organizationId,
        );

        // Get waiting counts for each service
        const serviceIds = filteredServices.map((s: any) => s.id);
        const { data: ticketCounts } = await supabase
          .from("tickets")
          .select("service_id")
          .in("service_id", serviceIds)
          .eq("status", "waiting");

        // Count tickets per service
        const waitingByService: Record<string, number> = {};
        (ticketCounts || []).forEach((ticket: any) => {
          waitingByService[ticket.service_id] =
            (waitingByService[ticket.service_id] || 0) + 1;
        });

        const result: TransferDestination[] = filteredServices.map(
          (service: any) => ({
            serviceId: service.id,
            serviceName: service.name,
            departmentId: service.departments.id,
            departmentName: service.departments.name,
            branchId: service.departments.branches.id,
            branchName: service.departments.branches.name,
            estimatedTime: service.estimated_time,
            waitingCount: waitingByService[service.id] || 0,
          }),
        );

        setDestinations(result);
        return result;
      } catch (error) {
        logger.error("Error fetching transfer destinations:", error);
        return [];
      } finally {
        setIsLoadingDestinations(false);
      }
    },
    [],
  );

  /**
   * Transfer a ticket to a different service
   */
  const transferTicket = useCallback(
    async (
      params: TransferTicketParams,
      context: TransferContext,
      fetchQueueData: () => void,
      showSuccess: (title: string, message: string) => void,
      showError: (title: string, message: string) => void,
    ): Promise<TransferTicketResult | null> => {
      const { ticketId, toServiceId, transferReason, transferNotes } = params;

      setIsLoading(true);
      try {
        logger.log("Starting ticket transfer operation", {
          ticketId,
          toServiceId,
          transferReason,
        });

        // Get ticket details before transfer (for notification)
        const { data: originalTicket } = await supabase
          .from("tickets")
          .select("customer_phone, ticket_number")
          .eq("id", ticketId)
          .single();

        // Get destination service details
        const { data: destinationService } = await supabase
          .from("services")
          .select(
            `
            id,
            name,
            departments!inner (
              id,
              name
            )
          `,
          )
          .eq("id", toServiceId)
          .single();

        const { data, error } = await supabase.rpc("transfer_ticket", {
          p_ticket_id: ticketId,
          p_target_service_id: toServiceId,
          p_transfer_reason: transferReason || null,
        });

        if (error) throw error;

        const result = data as TransferTicketResult;

        if (result.success) {
          logger.log("Ticket transfer successful", {
            ticketId: result.ticket_id,
            transferId: result.transfer_id,
            newPosition: result.new_position,
          });

          // Use the position returned by the RPC function
          const queuePosition = result.new_position;
          const estimatedWaitTime =
            queuePosition > 0 ? `~${queuePosition * 5} minutes` : "Soon";

          // Send WhatsApp notification if customer has phone
          if (originalTicket?.customer_phone && destinationService) {
            try {
              await whatsappNotificationService.notifyTicketTransferred(
                originalTicket.customer_phone,
                originalTicket.ticket_number,
                context.organizationName,
                context.organizationId,
                context.currentServiceName,
                context.currentDepartmentName,
                destinationService.name,
                (destinationService.departments as any)?.name || "Department",
                queuePosition,
                estimatedWaitTime,
              );
              logger.info("Transfer notification sent successfully");
            } catch (notificationError) {
              logger.error(
                "Failed to send transfer notification:",
                notificationError,
              );
              // Don't fail the transfer for notification errors
            }
          }

          // Refresh the queue data
          fetchQueueData();

          showSuccess(
            "Ticket Transferred Successfully",
            `Ticket ${originalTicket?.ticket_number || result.ticket_id} has been transferred and is now #${queuePosition} in the destination queue.`,
          );

          return result;
        } else {
          throw new Error("Transfer failed");
        }
      } catch (error: any) {
        logger.error("Error transferring ticket:", error);

        showError(
          "Transfer Failed",
          error.message || "Unable to transfer ticket. Please try again.",
        );

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Get transfer history for a ticket
   */
  const getTransferHistory = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase.rpc(
        "get_ticket_transfer_history",
        {
          p_ticket_id: ticketId,
        },
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching transfer history:", error);
      return [];
    }
  }, []);

  return {
    // State
    isLoading,
    isLoadingDestinations,
    destinations,
    // Actions
    fetchTransferDestinations,
    transferTicket,
    getTransferHistory,
  };
};
