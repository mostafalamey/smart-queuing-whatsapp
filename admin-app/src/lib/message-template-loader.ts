/**
 * Message Template Loader
 * Loads and processes message templates from the database for WhatsApp conversations
 */

import { createClient } from "@supabase/supabase-js";

// Create a server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface MessageTemplate {
  id: string;
  organization_id: string;
  templates: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariables {
  customer_name?: string;
  organization_name?: string;
  branch_name?: string;
  department_name?: string;
  service_name?: string;
  ticket_number?: string;
  queue_position?: string;
  estimated_wait?: string;
  current_serving?: string;
  waiting_count?: string;
  services_list?: string;
  branches_list?: string;
  departments_list?: string;
  max_number?: string;
  // camelCase versions for database template compatibility
  organizationName?: string;
  branchName?: string;
  departmentName?: string;
  serviceName?: string;
  ticketNumber?: string;
  queuePosition?: string;
  estimatedWait?: string;
  estimatedWaitTime?: string; // Database template expects this name
  currentServing?: string;
  currentlyServing?: string; // Database template expects this name
  waitingCount?: string;
  totalInQueue?: string; // Database template expects this name
  servicesList?: string;
  serviceList?: string; // Singular version for database template
  branchList?: string;
  departmentsList?: string;
  departmentList?: string; // Singular version for database template
  customerName?: string;
}

/**
 * Load message template from database
 */
export async function getMessageTemplate(
  organizationId: string,
  templateType: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    if (error) {
      console.error(
        `Error loading templates for organization ${organizationId}:`,
        error
      );
      return null;
    }

    if (!data?.templates) {
      console.warn(`No templates found for organization ${organizationId}`);
      return null;
    }

    // Map template types to the correct keys in the JSON structure
    const templateKey = mapTemplateTypeToKey(templateType);
    const template = data.templates[templateKey];

    if (!template) {
      console.warn(
        `Template ${templateType} (${templateKey}) not found for organization ${organizationId}`
      );
      return null;
    }

    // Extract WhatsApp message content from the template structure
    if (typeof template === "object" && template.whatsapp) {
      return template.whatsapp;
    } else if (typeof template === "string") {
      return template;
    }

    console.warn(
      `Template ${templateType} found but no WhatsApp content available`
    );
    return null;
  } catch (error) {
    console.error(`Failed to load template ${templateType}:`, error);
    return null;
  }
}

/**
 * Map template types used in code to keys used in database
 */
function mapTemplateTypeToKey(templateType: string): string {
  const mapping: Record<string, string> = {
    welcome_message: "welcomeMessage",
    branch_selection: "branchSelection",
    department_selection: "departmentSelection",
    service_selection: "serviceSelection",
    ticket_confirmation: "ticketConfirmation",
    almost_your_turn: "youAreNext",
    your_turn: "yourTurn",
    status_update: "statusUpdate",
  };

  return mapping[templateType] || templateType;
}

/**
 * Process template with variables
 */
export function processTemplate(
  template: string,
  variables: TemplateVariables
): string {
  if (!template) {
    return "";
  }

  let content = template;

  // Replace all variables in the template - support both {var} and {{var}} formats
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Try double curly braces first {{variable}}
      const doublePlaceholder = `{{${key}}}`;
      content = content.replace(
        new RegExp(doublePlaceholder.replace(/[{}]/g, "\\$&"), "g"),
        String(value)
      );

      // Try single curly braces {variable}
      const singlePlaceholder = `{${key}}`;
      content = content.replace(
        new RegExp(singlePlaceholder.replace(/[{}]/g, "\\$&"), "g"),
        String(value)
      );
    }
  });

  // Clean up any remaining unfilled variables (both formats)
  content = content.replace(/\{\{[^}]+\}\}/g, "");
  content = content.replace(/\{[^}]+\}/g, "");

  return content;
}

/**
 * Get processed message template with variables
 */
export async function getProcessedTemplate(
  organizationId: string,
  templateType: string,
  variables: TemplateVariables
): Promise<string | null> {
  const template = await getMessageTemplate(organizationId, templateType);

  if (!template) {
    console.warn(
      `Template ${templateType} not found for organization ${organizationId}`
    );
    return null;
  }

  return processTemplate(template, variables);
}

/**
 * Get fallback message if template is not found
 */
export function getFallbackMessage(
  templateType: string,
  variables: TemplateVariables
): string {
  const {
    customer_name = "Customer",
    organization_name = "Our Organization",
    branch_name = "Main Branch",
    department_name = "Department",
    service_name = "Service",
    ticket_number = "000",
    queue_position = "0",
    estimated_wait = "15 minutes",
    current_serving = "000",
    waiting_count = "0",
  } = variables;

  switch (templateType) {
    case "welcome_message":
      return `👋 *Welcome to ${organization_name}!*\n\nHow can we help you today?`;

    case "branch_selection":
      return `🏢 *Please select your preferred branch:*\n\n${
        variables.branches_list || "1️⃣ Main Branch"
      }\n\nReply with the number of your choice.`;

    case "department_selection":
      return `🏪 *${branch_name}*\n\nPlease select a department:\n\n${
        variables.departments_list || "1️⃣ General Service"
      }\n\nReply with the number of your choice.`;

    case "service_selection":
      return `🛍️ *${department_name}*\n\nPlease select your service:\n\n${
        variables.services_list || "1️⃣ General Service"
      }\n\nReply with the number of your choice.`;

    case "ticket_confirmation":
      return `✅ *Ticket Confirmed!*\n\n🎟️ **Ticket:** ${ticket_number}\n🏬 **Location:** ${branch_name} - ${department_name}\n🛍️ **Service:** ${service_name}\n👥 **Position in Queue:** ${queue_position}\n⏱️ **Estimated Wait:** ${estimated_wait}\n\n📱 You'll receive automatic updates as your turn approaches!\n\n💡 Reply 'status' to check your current position anytime.`;

    case "almost_your_turn":
      return `⏰ Almost your turn at ${organization_name}!\n\nYour ticket: *${ticket_number}*\nCurrently serving: ${current_serving}\n\nYou're next! Please be ready at the ${department_name} counter.\n\nThank you for your patience! 🙏`;

    case "your_turn":
      return `🔔 It's your turn!\n\nTicket: *${ticket_number}*\nPlease proceed to: ${department_name}\n\nThank you for choosing ${organization_name}! 🙏`;

    case "branch_selection_error":
      return "Please reply with the number of your desired branch (e.g., '1', '2', '3').";

    case "invalid_branch_number":
      return `Invalid branch number. Please choose a number between 1 and ${
        variables.max_number || "10"
      }.`;

    case "department_selection_error":
      return "Please reply with the number of your desired department (e.g., '1', '2', '3').";

    case "invalid_department_number":
      return `Invalid department number. Please choose a number between 1 and ${
        variables.max_number || "10"
      }.`;

    case "service_selection_error":
      return "Please reply with the number of your desired service (e.g., '1', '2', '3').";

    case "invalid_service_number":
      return `Invalid service number. Please choose a number between 1 and ${
        variables.max_number || "10"
      }.`;

    case "department_selection_error_restart":
      return "I'm sorry, there was an error with your department selection. Please start over by sending 'hello'.";

    default:
      return `Update for ticket ${ticket_number} at ${organization_name}`;
  }
}

/**
 * Get message with template fallback
 */
export async function getMessageWithFallback(
  organizationId: string,
  templateType: string,
  variables: TemplateVariables
): Promise<string> {
  // Try to get the template from database first
  const templateMessage = await getProcessedTemplate(
    organizationId,
    templateType,
    variables
  );

  if (templateMessage) {
    return templateMessage;
  }

  // Fall back to hardcoded message
  console.warn(`Using fallback message for template type: ${templateType}`);
  return getFallbackMessage(templateType, variables);
}
