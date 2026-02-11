// WhatsApp Conversation Engine
// Handles multi-step conversations for queue management

import { whatsappNotificationService } from "./whatsapp-notification-service";
import {
  getMessageWithFallback,
  type TemplateVariables,
} from "./message-template-loader";

export enum ConversationState {
  INITIAL_CONTACT = "initial_contact",
  AWAITING_BRANCH_SELECTION = "awaiting_branch_selection",
  AWAITING_DEPARTMENT_SELECTION = "awaiting_department_selection",
  AWAITING_SERVICE_SELECTION = "awaiting_service_selection",
  AWAITING_PHONE_NUMBER = "awaiting_phone_number",
  TICKET_CONFIRMED = "ticket_confirmed",
}

export interface WhatsAppConversation {
  id: string;
  phone_number: string;
  organization_id: string;
  branch_id?: string;
  department_id?: string;
  conversation_state: ConversationState;
  selected_service_id?: string;
  ticket_id?: string;
  customer_name?: string;
  context_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ServiceMenuItem {
  id: string;
  number: number;
  name: string;
  description?: string;
  estimated_wait_time?: string;
}

export class WhatsAppConversationEngine {
  constructor(private supabase: any) {}

  /**
   * Process incoming WhatsApp message and determine response
   */
  async processMessage(
    phoneNumber: string,
    messageBody: string,
    organizationId: string,
    branchId?: string,
    departmentId?: string,
  ): Promise<string> {
    try {
      // Check for restart commands first (regardless of current state)
      const lowerMessage = messageBody.toLowerCase().trim();
      if (
        lowerMessage === "hello" ||
        lowerMessage === "start" ||
        lowerMessage === "restart" ||
        lowerMessage === "new"
      ) {
        // Delete existing conversation and start fresh
        await this.deleteConversation(phoneNumber, organizationId);

        const conversation = await this.createInitialConversation(
          phoneNumber,
          organizationId,
          branchId,
          departmentId,
        );

        return await this.handleInitialContact(conversation, messageBody);
      }

      // Get or create conversation with context
      let conversation = await this.getConversation(
        phoneNumber,
        organizationId,
      );

      if (!conversation) {
        conversation = await this.createInitialConversation(
          phoneNumber,
          organizationId,
          branchId,
          departmentId,
        );
      }

      // Process message based on current state
      switch (conversation.conversation_state) {
        case ConversationState.INITIAL_CONTACT:
          return await this.handleInitialContact(conversation, messageBody);

        case ConversationState.AWAITING_BRANCH_SELECTION:
          return await this.handleBranchSelection(conversation, messageBody);

        case ConversationState.AWAITING_DEPARTMENT_SELECTION:
          return await this.handleDepartmentSelection(
            conversation,
            messageBody,
          );

        case ConversationState.AWAITING_SERVICE_SELECTION:
          return await this.handleServiceSelection(conversation, messageBody);

        case ConversationState.AWAITING_PHONE_NUMBER:
          // Legacy state - should not happen with new flow, but handle gracefully
          return "I have all the information I need. Let me create your ticket now...";

        case ConversationState.TICKET_CONFIRMED:
          return await this.handleTicketConfirmed(conversation, messageBody);

        default:
          return "I'm sorry, something went wrong. Please start over by sending 'hello'.";
      }
    } catch (error) {
      console.error("WhatsApp conversation error:", error);
      return "I'm sorry, there was an error processing your request. Please try again.";
    }
  }

  /**
   * Handle initial contact - determine next step based on QR context
   */
  private async handleInitialContact(
    conversation: WhatsAppConversation,
    messageBody: string,
  ): Promise<string> {
    // Determine what's already selected based on QR code context
    const hasBranch = !!conversation.branch_id;
    const hasDepartment = !!conversation.department_id;

    if (hasDepartment) {
      // Department-specific QR: Go directly to service selection
      return await this.showServicesForDepartment(
        conversation,
        conversation.department_id!,
      );
    } else if (hasBranch) {
      // Branch-specific QR: Show departments in this branch
      return await this.showDepartmentsForBranch(
        conversation,
        conversation.branch_id!,
      );
    } else {
      // General QR: Show all branches for organization
      return await this.showBranchesForOrganization(conversation);
    }
  }

  /**
   * Handle branch selection (from general QR code)
   */
  private async handleBranchSelection(
    conversation: WhatsAppConversation,
    messageBody: string,
  ): Promise<string> {
    const branchNumber = parseInt(messageBody.trim());

    if (isNaN(branchNumber)) {
      return await getMessageWithFallback(
        conversation.organization_id,
        "branch_selection_error",
        {},
      );
    }

    const branches = await this.getOrganizationBranches(
      conversation.organization_id,
    );
    const selectedBranch = branches.find((b: any) => b.number === branchNumber);

    if (!selectedBranch) {
      return await getMessageWithFallback(
        conversation.organization_id,
        "invalid_branch_number",
        { max_number: branches.length.toString() },
      );
    }

    // Update conversation with selected branch
    await this.updateConversation(conversation.id, {
      branch_id: selectedBranch.id,
    });

    // Show departments for selected branch
    return await this.showDepartmentsForBranch(conversation, selectedBranch.id);
  }

  /**
   * Handle department selection
   */
  private async handleDepartmentSelection(
    conversation: WhatsAppConversation,
    messageBody: string,
  ): Promise<string> {
    const departmentNumber = parseInt(messageBody.trim());

    if (isNaN(departmentNumber)) {
      return await getMessageWithFallback(
        conversation.organization_id,
        "department_selection_error",
        {},
      );
    }

    const branchId = conversation.branch_id;
    const departments = await this.getBranchDepartments(branchId!);
    const selectedDepartment = departments.find(
      (d: any) => d.number === departmentNumber,
    );

    if (!selectedDepartment) {
      return await getMessageWithFallback(
        conversation.organization_id,
        "invalid_department_number",
        { max_number: departments.length.toString() },
      );
    }

    // Update conversation with selected department
    await this.updateConversation(conversation.id, {
      department_id: selectedDepartment.id,
    });

    // Show services for selected department
    return await this.showServicesForDepartment(
      conversation,
      selectedDepartment.id,
    );
  }

  /**
   * Show branches for organization (General QR flow)
   */
  private async showBranchesForOrganization(
    conversation: WhatsAppConversation,
  ): Promise<string> {
    const branches = await this.getOrganizationBranches(
      conversation.organization_id,
    );

    if (branches.length === 0) {
      return "I'm sorry, no branches are currently available. Please contact the organization directly.";
    }

    // Update conversation state
    await this.updateConversationState(
      conversation.id,
      ConversationState.AWAITING_BRANCH_SELECTION,
    );

    // Get organization info
    const organization = await this.getOrganizationById(
      conversation.organization_id,
    );

    // Build branches list for template
    let branchesList = "";
    branches.forEach((branch: any) => {
      branchesList += `${branch.number}️⃣ ${branch.name}\n`;
      if (branch.address) {
        branchesList += `   📍 ${branch.address}\n`;
      }
    });

    // Use message template from database
    const templateVariables: TemplateVariables = {
      organization_name: organization?.name || "Our Organization",
      organizationName: organization?.name || "Our Organization", // camelCase for database template
      branches_list: branchesList.trim(),
      branchList: branchesList.trim(), // camelCase for database template
    };

    return await getMessageWithFallback(
      conversation.organization_id,
      "branch_selection",
      templateVariables,
    );
  }

  /**
   * Show departments for branch (General QR + Branch-specific QR flow)
   */
  private async showDepartmentsForBranch(
    conversation: WhatsAppConversation,
    branchId: string,
  ): Promise<string> {
    const departments = await this.getBranchDepartments(branchId);

    if (departments.length === 0) {
      return "I'm sorry, no departments are currently available in this branch. Please contact us directly.";
    }

    // Update conversation state
    await this.updateConversationState(
      conversation.id,
      ConversationState.AWAITING_DEPARTMENT_SELECTION,
    );

    // Get branch name for context
    const branch = await this.getBranchInfo(branchId);

    // Build departments list for template
    let departmentsList = "";
    departments.forEach((department: any) => {
      departmentsList += `${department.number}️⃣ ${department.name}\n`;
      if (department.description) {
        departmentsList += `   ${department.description}\n`;
      }
    });

    // Use message template from database
    const templateVariables: TemplateVariables = {
      branch_name: branch?.name || "Branch",
      branchName: branch?.name || "Branch", // camelCase for database template
      departments_list: departmentsList.trim(),
      departmentsList: departmentsList.trim(), // camelCase for database template
      departmentList: departmentsList.trim(), // Singular version for database template
    };

    return await getMessageWithFallback(
      conversation.organization_id,
      "department_selection",
      templateVariables,
    );
  }

  /**
   * Show services for department (All QR flows end here)
   */
  private async showServicesForDepartment(
    conversation: WhatsAppConversation,
    departmentId: string,
  ): Promise<string> {
    const services = await this.getDepartmentServices(departmentId);

    if (services.length === 0) {
      return "I'm sorry, no services are currently available in this department. Please contact us directly.";
    }

    // Update conversation state
    await this.updateConversationState(
      conversation.id,
      ConversationState.AWAITING_SERVICE_SELECTION,
    );

    // Get department and branch info for context
    const departmentInfo = await this.getDepartmentInfo(departmentId);

    // Build services list for template
    let servicesList = "";
    services.forEach((service: any) => {
      const waitTime = service.estimated_wait_time
        ? ` (${service.estimated_wait_time})`
        : "";
      servicesList += `${service.number}️⃣ ${service.name}${waitTime}\n`;
      if (service.description) {
        servicesList += `   📝 ${service.description}\n`;
      }
    });

    // Use message template from database
    const templateVariables: TemplateVariables = {
      department_name: departmentInfo?.name || "Department",
      departmentName: departmentInfo?.name || "Department", // camelCase for database template
      branch_name: departmentInfo?.branch_name || "Branch",
      branchName: departmentInfo?.branch_name || "Branch", // camelCase for database template
      services_list: servicesList.trim(),
      servicesList: servicesList.trim(), // camelCase for database template
      serviceList: servicesList.trim(), // Singular version for database template
    };

    return await getMessageWithFallback(
      conversation.organization_id,
      "service_selection",
      templateVariables,
    );
  }

  /**
   * Handle service selection
   */
  private async handleServiceSelection(
    conversation: WhatsAppConversation,
    messageBody: string,
  ): Promise<string> {
    const serviceNumber = parseInt(messageBody.trim());

    if (isNaN(serviceNumber)) {
      return await getMessageWithFallback(
        conversation.organization_id,
        "service_selection_error",
        {},
      );
    }

    // Ensure we have a department selected
    if (!conversation.department_id) {
      return await getMessageWithFallback(
        conversation.organization_id,
        "department_selection_error_restart",
        {},
      );
    }

    // Use department-specific services instead of organization-wide services
    const services = await this.getDepartmentServices(
      conversation.department_id,
    );
    const selectedService = services.find((s) => s.number === serviceNumber);

    if (!selectedService) {
      return await getMessageWithFallback(
        conversation.organization_id,
        "invalid_service_number",
        { max_number: services.length.toString() },
      );
    }

    console.log(
      `🎯 Creating ticket for service: ${selectedService.name} (ID: ${selectedService.id})`,
    );
    console.log(
      `🎯 Customer phone from conversation: ${conversation.phone_number}`,
    );

    // Create ticket directly using the phone number from the conversation
    // No need to ask customer to manually enter phone number since we have it from WhatsApp
    try {
      const ticket = await this.createTicketForService(
        conversation,
        selectedService.id,
        conversation.phone_number,
      );

      if (!ticket) {
        console.error("❌ Ticket creation returned null");
        return "Sorry, there was an error creating your ticket. Please try again.";
      }

      console.log(`✅ Ticket created successfully: ${ticket.id}`);

      // Send WhatsApp notification for ticket creation
      try {
        const organizationData = await this.getOrganizationById(
          conversation.organization_id,
        );
        const departmentData = await this.getDepartmentInfo(
          conversation.department_id!,
        );

        console.log("✅ Ticket creation completed successfully");
      } catch (notificationError) {
        console.error(
          "❌ Error in ticket creation process:",
          notificationError,
        );
        // Don't fail the ticket creation if there are errors
      }

      // Update conversation with ticket info and mark as confirmed
      try {
        await this.updateConversation(conversation.id, {
          selected_service_id: selectedService.id,
          ticket_id: ticket.id,
          conversation_state: ConversationState.TICKET_CONFIRMED,
          context_data: { customer_phone: conversation.phone_number },
        });
        console.log("✅ Conversation updated successfully");
      } catch (updateError) {
        console.error("❌ Error updating conversation:", updateError);
        // Continue to generate confirmation since ticket was created
      }

      try {
        const confirmationMessage = await this.generateTicketConfirmation(
          ticket,
          conversation.organization_id, // Pass organizationId from conversation
        );
        console.log("✅ Confirmation message generated");
        return confirmationMessage;
      } catch (confirmError) {
        console.error(
          "❌ Error generating confirmation message:",
          confirmError,
        );
        // Fallback confirmation since ticket is already created
        return `✅ **Ticket Created!**\n\n🎟️ Ticket: ${
          ticket.ticket_number || "Created"
        }\n📋 Service: ${
          selectedService.name
        }\n\n📱 You'll receive updates as your turn approaches!`;
      }
    } catch (error) {
      console.error("❌ Error in service selection:", error);
      return "Sorry, there was an error creating your ticket. Please try again or restart the conversation.";
    }
  }

  /**
   * Handle phone number collection and create ticket
   */
  private async handlePhoneCollection(
    conversation: WhatsAppConversation,
    messageBody: string,
  ): Promise<string> {
    const phoneNumber = this.validatePhoneNumber(messageBody.trim());

    if (!phoneNumber) {
      return "Please provide a valid phone number with country code (e.g., +1234567890).";
    }

    // Create ticket
    const ticket = await this.createTicket(conversation, phoneNumber);

    if (!ticket) {
      return "Sorry, there was an error creating your ticket. Please try again.";
    }

    // Update conversation
    await this.updateConversation(conversation.id, {
      ticket_id: ticket.id,
      conversation_state: ConversationState.TICKET_CONFIRMED,
      context_data: { customer_phone: phoneNumber },
    });

    return await this.generateTicketConfirmation(
      ticket,
      conversation.organization_id,
    );
  }

  /**
   * Handle messages after ticket is confirmed
   */
  private async handleTicketConfirmed(
    conversation: WhatsAppConversation,
    messageBody: string,
  ): Promise<string> {
    const lowerMessage = messageBody.toLowerCase().trim();

    if (lowerMessage.includes("status") || lowerMessage.includes("position")) {
      return await this.getTicketStatus(conversation.ticket_id!);
    }

    if (lowerMessage.includes("cancel")) {
      return await this.handleCancellation(conversation.ticket_id!);
    }

    if (
      lowerMessage === "new" ||
      lowerMessage === "restart" ||
      lowerMessage.includes("new ticket") ||
      lowerMessage.includes("another")
    ) {
      return "To start a new queue request, please send 'hello' or 'restart'.";
    }

    return (
      "Your ticket is confirmed! You'll receive automatic updates as your turn approaches.\n\n" +
      "Reply 'status' to check your position, 'cancel' to cancel your ticket, or 'restart' to create a new ticket."
    );
  }

  /**
   * Generate services menu message
   */
  private generateServicesMenu(
    services: ServiceMenuItem[],
    conversation: WhatsAppConversation,
  ): string {
    let message = `🏢 Welcome to our queue system!\n\n`;
    message += `📋 **Available Services:**\n\n`;

    services.forEach((service) => {
      const waitTime = service.estimated_wait_time
        ? ` (${service.estimated_wait_time})`
        : "";
      message += `${service.number}️⃣ ${service.name}${waitTime}\n`;
    });

    message += `\n💬 Reply with the number of your desired service.`;

    return message;
  }

  /**
   * Generate ticket confirmation message using database templates
   */
  private async generateTicketConfirmation(
    ticket: any,
    organizationId?: string,
  ): Promise<string> {
    console.log(
      "🎫 Generating confirmation for ticket:",
      JSON.stringify(ticket, null, 2),
    );

    // Handle different possible ticket data structures
    const ticketNumber = ticket.ticket_number || ticket.number || "Unknown";
    const serviceName =
      ticket.services?.name || ticket.service?.name || "Unknown Service";
    const position = ticket.queue_position || ticket.position || 1;
    const branchName =
      ticket.services?.departments?.branches?.name || "Main Branch";
    const departmentName = ticket.services?.departments?.name || "Department";

    // Use passed organizationId or try to extract from ticket
    const finalOrganizationId =
      organizationId ||
      ticket.services?.departments?.branches?.organization_id ||
      null;

    // Calculate proper estimated wait time using analytics data
    let estimatedWait = this.formatWaitTime(15); // Fallback
    try {
      console.log("🔍 Ticket data for wait time calculation:", {
        service_id: ticket.service_id,
        department_id: ticket.services?.department_id,
        estimated_time: ticket.services?.estimated_time,
      });

      if (ticket.service_id && ticket.services?.departments?.id) {
        console.log("📊 Calculating analytics wait time for confirmation...");
        estimatedWait = await this.calculateEnhancedWaitTime(
          ticket.service_id,
          ticket.services.departments.id,
          ticket.services.estimated_time || 15,
        );
        console.log("✅ Analytics wait time calculated:", estimatedWait);
      } else {
        console.log(
          "⚠️ Missing data for analytics calculation, using fallback",
        );
      }
    } catch (error) {
      console.error("Error calculating wait time for confirmation:", error);
    }

    // Prepare template variables
    const templateVariables: TemplateVariables = {
      customer_name: "Customer",
      customerName: "Customer", // camelCase for database template
      organization_name:
        ticket.services?.departments?.branches?.name || "Organization",
      organizationName:
        ticket.services?.departments?.branches?.name || "Organization", // camelCase for database template
      branch_name: branchName,
      branchName: branchName, // camelCase for database template
      department_name: departmentName,
      departmentName: departmentName, // camelCase for database template
      service_name: serviceName,
      serviceName: serviceName, // camelCase for database template
      ticket_number: ticketNumber,
      ticketNumber: ticketNumber, // camelCase for database template
      queue_position: String(position),
      queuePosition: String(position), // camelCase for database template
      estimated_wait: estimatedWait,
      estimatedWait: estimatedWait, // camelCase for database template
      estimatedWaitTime: estimatedWait, // Database template expects this name
    };

    // Use database template if organization ID is available, otherwise use fallback
    if (finalOrganizationId) {
      try {
        const templateMessage = await getMessageWithFallback(
          finalOrganizationId,
          "ticket_confirmation",
          templateVariables,
        );
        return templateMessage;
      } catch (error) {
        console.error("Error loading template from database:", error);
      }
    }

    // Fallback to hardcoded template
    console.log("⚠️ Using fallback template for ticket confirmation");
    return (
      `✅ **Ticket Confirmed!**\n\n` +
      `🎟️ **Ticket:** ${ticketNumber}\n` +
      `🏬 **Location:** ${branchName} - ${departmentName}\n` +
      `🛍️ **Service:** ${serviceName}\n` +
      `👥 **Position in Queue:** ${position}\n` +
      `⏱️ **Estimated Wait:** ${estimatedWait}\n\n` +
      `📱 You'll receive automatic updates as your turn approaches!\n\n` +
      `💡 Reply 'status' to check your current position anytime.`
    );
  }

  /**
   * Get or create conversation
   */
  private async getConversation(
    phoneNumber: string,
    organizationId: string,
  ): Promise<WhatsAppConversation | null> {
    const { data, error } = await this.supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching conversation:", error);
      return null;
    }

    return data?.[0] || null;
  }

  /**
   * Create initial conversation with QR code context
   */
  private async createInitialConversation(
    phoneNumber: string,
    organizationId: string,
    branchId?: string,
    departmentId?: string,
  ): Promise<WhatsAppConversation> {
    const { data, error } = await this.supabase
      .from("whatsapp_conversations")
      .insert({
        phone_number: phoneNumber,
        organization_id: organizationId,
        branch_id: branchId,
        department_id: departmentId,
        conversation_state: ConversationState.INITIAL_CONTACT,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return data;
  }

  /**
   * Update conversation state
   */
  private async updateConversationState(
    conversationId: string,
    state: ConversationState,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("whatsapp_conversations")
      .update({
        conversation_state: state,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) {
      throw new Error(`Failed to update conversation state: ${error.message}`);
    }
  }

  /**
   * Update conversation with additional data
   */
  private async updateConversation(
    conversationId: string,
    updates: Partial<WhatsAppConversation>,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("whatsapp_conversations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`);
    }
  }

  /**
   * Delete conversation (for restart functionality)
   */
  private async deleteConversation(
    phoneNumber: string,
    organizationId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("whatsapp_conversations")
      .delete()
      .eq("phone_number", phoneNumber)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deleting conversation:", error);
      // Don't throw error - just log it, as we can still continue with creating a new conversation
    }
  }

  /**
   * Get available services for organization (legacy method - now used for department)
   */
  private async getAvailableServices(
    organizationId: string,
  ): Promise<ServiceMenuItem[]> {
    const { data, error } = await this.supabase
      .from("services")
      .select(
        `
        id,
        name,
        description,
        departments!inner (
          id,
          name,
          branches!inner (
            id,
            name,
            organization_id
          )
        )
      `,
      )
      .eq("departments.branches.organization_id", organizationId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching services:", error);
      return [];
    }

    return (
      data?.map((service: any, index: number) => ({
        id: service.id,
        number: index + 1,
        name: service.name,
        description: service.description,
      })) || []
    );
  }

  /**
   * Get branches for organization (General QR code flow)
   */
  private async getOrganizationBranches(
    organizationId: string,
  ): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("branches")
      .select(
        `
        id,
        name,
        address
      `,
      )
      .eq("organization_id", organizationId)
      .order("name");

    if (error) {
      console.error("Error fetching branches:", error);
      return [];
    }

    return (
      data?.map((branch: any, index: number) => ({
        ...branch,
        number: index + 1,
      })) || []
    );
  }

  /**
   * Get organization info by ID
   */
  private async getOrganizationById(
    organizationId: string,
  ): Promise<{ id: string; name: string } | null> {
    const { data, error } = await this.supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .single();

    if (error) {
      console.error("Error fetching organization:", error);
      return null;
    }

    return data;
  }

  /**
   * Get departments for branch (Branch-specific QR code flow)
   */
  private async getBranchDepartments(branchId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("departments")
      .select(
        `
        id,
        name,
        description
      `,
      )
      .eq("branch_id", branchId)
      .order("name");

    if (error) {
      console.error("Error fetching departments:", error);
      return [];
    }

    return (
      data?.map((department: any, index: number) => ({
        ...department,
        number: index + 1,
      })) || []
    );
  }

  /**
   * Get services for department (Department-specific QR code flow)
   */
  private async getDepartmentServices(departmentId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("services")
      .select(
        `
        id,
        name,
        description,
        estimated_time
      `,
      )
      .eq("department_id", departmentId)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching services for department:", error);
      return [];
    }

    // Calculate enhanced wait times for each service
    const servicesWithWaitTimes = await Promise.all(
      (data || []).map(async (service: any, index: number) => {
        const waitTime = await this.calculateEnhancedWaitTime(
          service.id,
          departmentId,
          service.estimated_time || 15,
        );

        return {
          ...service,
          number: index + 1,
          estimated_wait_time: waitTime,
        };
      }),
    );

    return servicesWithWaitTimes;
  }

  /**
   * Get branch information
   */
  private async getBranchInfo(branchId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("branches")
      .select(
        `
        id,
        name,
        address
      `,
      )
      .eq("id", branchId)
      .single();

    if (error) {
      console.error("Error fetching branch info:", error);
      return null;
    }

    return data;
  }

  /**
   * Get department information with branch context
   */
  private async getDepartmentInfo(departmentId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("departments")
      .select(
        `
        id,
        name,
        description,
        branches (
          id,
          name
        )
      `,
      )
      .eq("id", departmentId)
      .single();

    if (error) {
      console.error("Error fetching department info:", error);
      return null;
    }

    return {
      ...data,
      branch_name: (data as any)?.branches?.name || "Unknown Branch",
    };
  }

  /**
   * Create ticket from conversation
   */
  private async createTicket(
    conversation: WhatsAppConversation,
    customerPhone: string,
  ): Promise<any> {
    const serviceInfo = await this.getServiceInfo(
      conversation.selected_service_id!,
    );

    if (!serviceInfo) {
      console.error("Error creating ticket: service info not found");
      return null;
    }

    const { data: ticket, error } = await this.supabase
      .rpc("create_ticket_for_service", {
        p_service_id: conversation.selected_service_id,
        p_customer_phone: customerPhone,
        p_created_via: "whatsapp",
      })
      .single();

    if (error) {
      console.error("Error creating ticket:", error);
      return null;
    }

    return {
      ...ticket,
      services: {
        id: serviceInfo.id,
        name: serviceInfo.name,
        department_id: serviceInfo.department_id,
        departments: serviceInfo.departments,
      },
    };
  }

  /**
   * Create ticket for specific service (improved flow - matches customer app logic)
   */
  private async createTicketForService(
    conversation: WhatsAppConversation,
    serviceId: string,
    customerPhone: string,
  ): Promise<any> {
    try {
      console.log(
        `🎫 Creating ticket for service: ${serviceId}, phone: ${customerPhone}`,
      );

      // Get service details with department info (matching customer app logic exactly)
      const { data: service, error: serviceError } = await this.supabase
        .from("services")
        .select(
          `
          id,
          name,
          department_id,
          service_code,
          departments (
            id,
            name,
            branches (
              id,
              name,
              organization_id
            )
          )
        `,
        )
        .eq("id", serviceId)
        .single();

      console.log("Service query result:", { service, serviceError });

      if (serviceError || !service) {
        console.error("❌ Service not found:", serviceError);
        return null;
      }

      console.log("About to create ticket with data:", {
        service_id: serviceId,
        department_id: service.department_id,
        customer_phone: customerPhone.startsWith("+")
          ? customerPhone
          : `+${customerPhone}`,
        status: "waiting",
      });

      // Create the ticket using atomic RPC to avoid race conditions
      const { data: newTicket, error: ticketError } = await this.supabase
        .rpc("create_ticket_for_service", {
          p_service_id: serviceId,
          p_customer_phone: customerPhone.startsWith("+")
            ? customerPhone
            : `+${customerPhone}`,
          p_created_via: "whatsapp",
        })
        .single();

      console.log("Ticket creation result:", { newTicket, ticketError });

      if (ticketError) {
        console.error("Error creating ticket:", ticketError);
        return null;
      }

      // Get queue position
      const position = await this.getQueuePosition(newTicket.id, serviceId);

      return {
        ...newTicket,
        queue_position: position,
        services: {
          id: service.id,
          name: service.name,
          department_id: service.department_id,
          departments: service.departments,
        },
      };
    } catch (error) {
      console.error("❌ Error in createTicketForService:", error);
      return null;
    }
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phone: string): string | null {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // Check if it starts with + and has at least 10 digits
    if (cleaned.match(/^\+\d{10,15}$/)) {
      return cleaned;
    }

    return null;
  }

  /**
   * Get next ticket number for service
   */
  private async getNextTicketNumber(serviceId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from("tickets")
      .select("ticket_number")
      .eq("service_id", serviceId)
      .like("ticket_number", "A%")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      return "A001";
    }

    const lastNumber = data[0].ticket_number;
    const number = parseInt(lastNumber.substring(1)) + 1;
    return `A${number.toString().padStart(3, "0")}`;
  }

  /**
   * Get service information for ticket creation
   */
  private async getServiceInfo(serviceId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("services")
      .select(
        `
        id,
        name,
        department_id,
        departments (
          id,
          name,
          branches (
            id,
            name,
            organization_id
          )
        )
      `,
      )
      .eq("id", serviceId)
      .single();

    if (error) {
      console.error("Error fetching service info:", error);
      return null;
    }

    return data;
  }

  /**
   * Generate next ticket number using service name format (BRE-025)
   */
  private async getNextTicketNumberForService(
    serviceInfo: any,
  ): Promise<string> {
    // Extract first 3 letters from service name and convert to uppercase
    const serviceName = serviceInfo.name.toUpperCase();
    const prefix = serviceName.substring(0, 3).replace(/[^A-Z]/g, "");

    // Ensure we have at least 3 characters, pad with 'X' if needed
    const ticketPrefix = prefix.padEnd(3, "X");

    // Get the latest ticket number for this service
    const { data, error } = await this.supabase
      .from("tickets")
      .select("ticket_number")
      .eq("service_id", serviceInfo.id)
      .like("ticket_number", `${ticketPrefix}-%`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      return `${ticketPrefix}-001`;
    }

    // Extract the number part and increment
    const lastTicket = data[0].ticket_number;
    const numberPart = lastTicket.split("-")[1];
    const nextNumber = parseInt(numberPart) + 1;

    return `${ticketPrefix}-${nextNumber.toString().padStart(3, "0")}`;
  }

  /**
   * Get queue position for ticket
   */
  private async getQueuePosition(
    ticketId: string,
    serviceId: string,
  ): Promise<number> {
    const { count, error } = await this.supabase
      .from("tickets")
      .select("id", { count: "exact" })
      .eq("service_id", serviceId)
      .in("status", ["waiting", "called"])
      .lt("created_at", new Date().toISOString());

    if (error) {
      console.error("Error getting queue position:", error);
      return 1;
    }

    return (count || 0) + 1;
  }

  /**
   * Calculate enhanced estimated wait time using database and analytics data
   */
  private async calculateEnhancedWaitTime(
    serviceId: string,
    departmentId: string,
    estimatedServiceTime: number = 15,
  ): Promise<string> {
    try {
      console.log(
        `🧮 Calculating wait time for service ${serviceId}, database estimated_time: ${estimatedServiceTime}min`,
      );

      // First, check if we have analytics data for this service
      const { data: analyticsData, error: analyticsError } = await this.supabase
        .from("service_analytics")
        .select("*")
        .eq("service_id", serviceId)
        .limit(1);

      console.log(
        `🔍 Analytics query result for service ${serviceId}:`,
        analyticsData,
      );
      if (analyticsError) {
        console.log(`❌ Analytics query error:`, analyticsError);
      }

      let finalWaitTime: number;

      // Check multiple possible column names for average service time
      const analyticsRecord = analyticsData?.[0];
      const analyticsTime =
        analyticsRecord?.avg_wait_time ||
        analyticsRecord?.average_wait_time ||
        analyticsRecord?.average_service_time ||
        analyticsRecord?.avg_service_time;

      if (analyticsTime && analyticsTime > 0) {
        // Use analytics data if available
        finalWaitTime = analyticsTime;
        console.log(
          `📊 Using analytics average: ${finalWaitTime}min for service ${serviceId}`,
        );
      } else {
        // Fall back to database estimated_time
        finalWaitTime = estimatedServiceTime;
        console.log(
          `📋 Using database estimated_time: ${finalWaitTime}min for service ${serviceId} (no analytics)`,
        );
      }

      return this.formatWaitTime(Math.round(finalWaitTime));
    } catch (error) {
      console.error(
        `❌ Error calculating wait time for service ${serviceId}:`,
        error,
      );
      return this.formatWaitTime(estimatedServiceTime);
    }
  }

  /**
   * Get analytics-based wait time estimation
   */
  private async getAnalyticsBasedWaitTime(
    serviceId: string,
    departmentId: string,
    currentQueueLength: number,
  ): Promise<number> {
    try {
      // Get recent analytics data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: analyticsData } = await this.supabase
        .from("daily_analytics")
        .select("avg_wait_time, avg_service_time, hourly_wait_times")
        .eq("service_id", serviceId)
        .eq("department_id", departmentId)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false })
        .limit(30);

      if (!analyticsData || analyticsData.length === 0) {
        return 0; // No analytics data available
      }

      // Calculate weighted average based on recency
      let totalWeight = 0;
      let weightedWaitTime = 0;
      let weightedServiceTime = 0;

      analyticsData.forEach((record: any, index: number) => {
        // More recent data gets higher weight
        const weight = 1 / (index + 1);
        totalWeight += weight;

        weightedWaitTime += (record.avg_wait_time || 0) * weight;
        weightedServiceTime += (record.avg_service_time || 0) * weight;
      });

      if (totalWeight === 0) return 0;

      const avgWaitTime = weightedWaitTime / totalWeight;
      const avgServiceTime = weightedServiceTime / totalWeight;

      // Estimate based on current queue length and historical service time
      const estimatedWaitTime =
        currentQueueLength * avgServiceTime + avgWaitTime;

      // Apply current time-of-day adjustment if hourly data is available
      const currentHour = new Date().getHours();
      const hourlyAdjustment = this.getHourlyAdjustment(
        analyticsData,
        currentHour,
      );

      return estimatedWaitTime * hourlyAdjustment;
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      return 0;
    }
  }

  /**
   * Get hourly adjustment factor based on historical patterns
   */
  private getHourlyAdjustment(
    analyticsData: any[],
    currentHour: number,
  ): number {
    try {
      // Look for hourly patterns in the data
      const hourlyWaitTimes: number[] = [];

      analyticsData.forEach((record) => {
        if (
          record.hourly_wait_times &&
          Array.isArray(record.hourly_wait_times)
        ) {
          const hourData = record.hourly_wait_times.find(
            (h: any) => h.hour === currentHour,
          );
          if (hourData && hourData.avg_wait_time) {
            hourlyWaitTimes.push(hourData.avg_wait_time);
          }
        }
      });

      if (hourlyWaitTimes.length === 0) return 1.0; // No adjustment

      // Calculate average for this hour
      const avgHourlyWaitTime =
        hourlyWaitTimes.reduce((a, b) => a + b, 0) / hourlyWaitTimes.length;

      // Calculate overall average for comparison
      const overallAvg =
        analyticsData.reduce(
          (sum, record) => sum + (record.avg_wait_time || 0),
          0,
        ) / analyticsData.length;

      if (overallAvg === 0) return 1.0;

      // Return adjustment factor (how much longer/shorter this hour typically is)
      const adjustment = avgHourlyWaitTime / overallAvg;

      // Cap the adjustment between 0.5x and 2.0x for reasonableness
      return Math.max(0.5, Math.min(2.0, adjustment));
    } catch (error) {
      console.error("Error calculating hourly adjustment:", error);
      return 1.0; // No adjustment on error
    }
  }

  /**
   * Format wait time into readable string
   */
  private formatWaitTime(minutes: number): string {
    if (minutes < 60) {
      return `${Math.max(1, Math.round(minutes))}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get current ticket status
   */
  private async getTicketStatus(ticketId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from("tickets")
      .select(
        `
        *,
        services (name)
      `,
      )
      .eq("id", ticketId)
      .single();

    if (error || !data) {
      return "Sorry, I couldn't find your ticket. Please contact support.";
    }

    const position = await this.getQueuePosition(data.id, data.service_id);
    const estimatedWait = this.formatWaitTime(position * 15); // Basic estimation for status check

    return (
      `📊 **Ticket Status**\n\n` +
      `🎟️ **Ticket:** #${data.ticket_number}\n` +
      `📍 **Service:** ${data.services.name}\n` +
      `👥 **Current Position:** ${position}\n` +
      `⏱️ **Estimated Wait:** ${estimatedWait}\n` +
      `📅 **Status:** ${
        data.status.charAt(0).toUpperCase() + data.status.slice(1)
      }`
    );
  }

  /**
   * Handle ticket cancellation
   */
  private async handleCancellation(ticketId: string): Promise<string> {
    const { error } = await this.supabase
      .from("tickets")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    if (error) {
      return "Sorry, there was an error cancelling your ticket. Please contact support.";
    }

    return (
      `❌ **Ticket Cancelled**\n\n` +
      `Your ticket has been successfully cancelled.\n\n` +
      `Thank you for using our queue system!`
    );
  }
}
