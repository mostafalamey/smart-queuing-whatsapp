import { supabase } from "./supabase";

interface OrganizationResponse {
  name: string;
  whatsapp_business_number: string;
  qr_code_message_template?: string;
}

interface BranchResponse {
  name: string;
  organization: OrganizationResponse;
}

interface DepartmentResponse {
  name: string;
  branch: {
    name: string;
    organization: OrganizationResponse;
  };
}

/**
 * WhatsApp URL utility functions for QR Management
 */
export class WhatsAppURLUtils {
  /**
   * Generate WhatsApp URL for organization access
   */
  static async generateOrganizationWhatsAppURL(
    organizationId: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("name, whatsapp_business_number, qr_code_message_template")
        .eq("id", organizationId)
        .single();

      if (error || !data) {
        throw new Error(`Organization not found: ${organizationId}`);
      }

      if (!data.whatsapp_business_number) {
        throw new Error(
          `WhatsApp business number not configured for organization`
        );
      }

      const message = this.generateMessage(
        data.name,
        data.qr_code_message_template
      );
      return this.createWhatsAppURL(data.whatsapp_business_number, message);
    } catch (error) {
      console.error("Error generating organization WhatsApp URL:", error);
      throw error;
    }
  }

  /**
   * Generate WhatsApp URL for branch access
   */
  static async generateBranchWhatsAppURL(branchId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select(
          `
          name,
          organizations!inner(
            name,
            whatsapp_business_number,
            qr_code_message_template
          )
        `
        )
        .eq("id", branchId)
        .single();

      if (error || !data) {
        throw new Error(`Branch not found: ${branchId}`);
      }

      // Access organization data (Supabase returns as array for joined relations)
      const organization = (data as any).organizations;

      if (!organization?.whatsapp_business_number) {
        throw new Error(
          `WhatsApp business number not configured for organization`
        );
      }

      const message = this.generateMessage(
        `${organization.name} - ${data.name}`,
        organization.qr_code_message_template
      );
      return this.createWhatsAppURL(
        organization.whatsapp_business_number,
        message
      );
    } catch (error) {
      console.error("Error generating branch WhatsApp URL:", error);
      throw error;
    }
  }

  /**
   * Generate WhatsApp URL for department access
   */
  static async generateDepartmentWhatsAppURL(
    departmentId: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select(
          `
          name,
          branches!inner(
            name,
            organizations!inner(
              name,
              whatsapp_business_number,
              qr_code_message_template
            )
          )
        `
        )
        .eq("id", departmentId)
        .single();

      if (error || !data) {
        throw new Error(`Department not found: ${departmentId}`);
      }

      // Access nested organization data
      const branch = (data as any).branches;
      const organization = branch?.organizations;

      if (!organization?.whatsapp_business_number) {
        throw new Error(
          `WhatsApp business number not configured for organization`
        );
      }

      const message = this.generateMessage(
        `${organization.name} - ${branch.name} - ${data.name}`,
        organization.qr_code_message_template
      );
      return this.createWhatsAppURL(
        organization.whatsapp_business_number,
        message
      );
    } catch (error) {
      console.error("Error generating department WhatsApp URL:", error);
      throw error;
    }
  }

  /**
   * Create WhatsApp deep link URL
   */
  private static createWhatsAppURL(
    businessNumber: string,
    message: string
  ): string {
    // Remove + from phone number for WhatsApp URL
    const cleanNumber = businessNumber.replace(/^\+/, "");

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp URL
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }

  /**
   * Generate the initial contact message
   */
  private static generateMessage(
    contextName: string,
    template?: string
  ): string {
    const defaultTemplate = "Hello! I would like to join the queue.";
    const messageTemplate = template || defaultTemplate;

    // Replace placeholders in template
    return messageTemplate
      .replace(/\{\{organization_name\}\}/g, contextName)
      .replace(/\{\{context\}\}/g, contextName);
  }

  /**
   * Copy WhatsApp URL to clipboard with success action
   */
  static async copyWhatsAppURL(
    url: string,
    contextName: string,
    showSuccess: (title: string, message: string, action?: any) => void,
    showError: (title: string, message: string) => void
  ): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess(
        "WhatsApp URL Copied!",
        `${contextName} WhatsApp link has been copied to your clipboard.`,
        {
          label: "Open WhatsApp",
          onClick: () => window.open(url, "_blank"),
        }
      );
    } catch (error) {
      showError("Copy Failed", "Unable to copy URL to clipboard.");
    }
  }
}
