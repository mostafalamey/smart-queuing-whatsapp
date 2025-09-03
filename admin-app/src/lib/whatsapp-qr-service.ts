import * as QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QRCodeData {
  organizationId: string;
  branchId?: string;
  departmentId?: string;
  serviceId?: string;
}

interface OrganizationData {
  id: string;
  name: string;
  whatsapp_business_number: string;
  qr_code_message_template?: string;
}

interface BranchData {
  id: string;
  name: string;
  organization: OrganizationData;
}

interface DepartmentData {
  id: string;
  name: string;
  branch: BranchData;
}

export class WhatsAppQRCodeService {
  /**
   * Generate WhatsApp QR Code for organization
   */
  static async generateOrganizationQR(organizationId: string): Promise<string> {
    const organization = await this.getOrganizationData(organizationId);
    const message = this.generateMessage(
      organization.name,
      organization.qr_code_message_template
    );
    const whatsappUrl = this.createWhatsAppURL(
      organization.whatsapp_business_number,
      message
    );

    return await this.generateQRCodeImage(whatsappUrl);
  }

  /**
   * Generate WhatsApp QR Code for specific branch
   */
  static async generateBranchQR(branchId: string): Promise<string> {
    const branch = await this.getBranchData(branchId);
    const message = this.generateMessage(
      `${branch.organization.name} - ${branch.name}`,
      branch.organization.qr_code_message_template
    );
    const whatsappUrl = this.createWhatsAppURL(
      branch.organization.whatsapp_business_number,
      message
    );

    return await this.generateQRCodeImage(whatsappUrl);
  }

  /**
   * Generate WhatsApp QR Code for specific department
   */
  static async generateDepartmentQR(departmentId: string): Promise<string> {
    const department = await this.getDepartmentData(departmentId);
    const message = this.generateMessage(
      `${department.branch.organization.name} - ${department.branch.name} - ${department.name}`,
      department.branch.organization.qr_code_message_template
    );
    const whatsappUrl = this.createWhatsAppURL(
      department.branch.organization.whatsapp_business_number,
      message
    );

    return await this.generateQRCodeImage(whatsappUrl);
  }

  /**
   * Generate WhatsApp QR Code with custom message
   */
  static async generateCustomQR(
    organizationId: string,
    customMessage: string
  ): Promise<string> {
    const organization = await this.getOrganizationData(organizationId);
    const whatsappUrl = this.createWhatsAppURL(
      organization.whatsapp_business_number,
      customMessage
    );

    return await this.generateQRCodeImage(whatsappUrl);
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
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    console.log(`📱 Generated WhatsApp URL: ${whatsappUrl}`);
    return whatsappUrl;
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
    const message = messageTemplate
      .replace(/\{\{organization_name\}\}/g, contextName)
      .replace(/\{\{context\}\}/g, contextName);

    return message;
  }

  /**
   * Generate QR code image as data URL
   */
  private static async generateQRCodeImage(url: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      });

      console.log(`✅ QR Code generated successfully`);
      return qrCodeDataURL;
    } catch (error) {
      console.error("❌ Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Get organization data
   */
  private static async getOrganizationData(
    organizationId: string
  ): Promise<OrganizationData> {
    const { data, error } = await supabase
      .from("organizations")
      .select(
        `
        id,
        name,
        whatsapp_business_number,
        qr_code_message_template
      `
      )
      .eq("id", organizationId)
      .single();

    if (error || !data) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    if (!data.whatsapp_business_number) {
      throw new Error(
        `WhatsApp business number not configured for organization: ${organizationId}`
      );
    }

    return data;
  }

  /**
   * Get branch data with organization
   */
  private static async getBranchData(branchId: string): Promise<BranchData> {
    const { data, error } = await supabase
      .from("branches")
      .select(
        `
        id,
        name,
        organizations (
          id,
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

    const organization = data.organizations as any;
    if (!organization?.whatsapp_business_number) {
      throw new Error(
        `WhatsApp business number not configured for branch organization: ${branchId}`
      );
    }

    return {
      id: data.id,
      name: data.name,
      organization: organization,
    };
  }

  /**
   * Get department data with branch and organization
   */
  private static async getDepartmentData(
    departmentId: string
  ): Promise<DepartmentData> {
    const { data, error } = await supabase
      .from("departments")
      .select(
        `
        id,
        name,
        branches (
          id,
          name,
          organizations (
            id,
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

    const branch = data.branches as any;
    const organization = branch?.organizations as any;

    if (!organization?.whatsapp_business_number) {
      throw new Error(
        `WhatsApp business number not configured for department organization: ${departmentId}`
      );
    }

    return {
      id: data.id,
      name: data.name,
      branch: {
        id: branch.id,
        name: branch.name,
        organization: organization,
      },
    };
  }

  /**
   * Generate multiple QR codes for different contexts
   */
  static async generateMultipleQRCodes(organizationId: string): Promise<{
    organization: string;
    branches: Array<{ id: string; name: string; qrCode: string }>;
    departments: Array<{
      id: string;
      name: string;
      branchName: string;
      qrCode: string;
    }>;
  }> {
    try {
      // Get organization QR
      const organizationQR = await this.generateOrganizationQR(organizationId);

      // Get all branches for this organization
      const { data: branches, error: branchError } = await supabase
        .from("branches")
        .select("id, name")
        .eq("organization_id", organizationId);

      if (branchError) {
        throw new Error(`Failed to fetch branches: ${branchError.message}`);
      }

      // Generate QR codes for all branches
      const branchQRs = await Promise.all(
        (branches || []).map(async (branch) => ({
          id: branch.id,
          name: branch.name,
          qrCode: await this.generateBranchQR(branch.id),
        }))
      );

      // Get all departments for this organization
      const { data: departments, error: departmentError } = await supabase
        .from("departments")
        .select(
          `
          id, 
          name,
          branches!inner (
            id,
            name,
            organization_id
          )
        `
        )
        .eq("branches.organization_id", organizationId);

      if (departmentError) {
        throw new Error(
          `Failed to fetch departments: ${departmentError.message}`
        );
      }

      // Generate QR codes for all departments
      const departmentQRs = await Promise.all(
        (departments || []).map(async (dept: any) => ({
          id: dept.id,
          name: dept.name,
          branchName: dept.branches.name,
          qrCode: await this.generateDepartmentQR(dept.id),
        }))
      );

      return {
        organization: organizationQR,
        branches: branchQRs,
        departments: departmentQRs,
      };
    } catch (error) {
      console.error("❌ Error generating multiple QR codes:", error);
      throw error;
    }
  }

  /**
   * Validate WhatsApp business number format
   */
  static validateWhatsAppNumber(number: string): boolean {
    // Remove all non-digit characters except +
    const cleaned = number.replace(/[^\d+]/g, "");

    // Check if it starts with + and has at least 10 digits
    return /^\+\d{10,15}$/.test(cleaned);
  }

  /**
   * Test WhatsApp deep link (without sending message)
   */
  static async testWhatsAppLink(organizationId: string): Promise<{
    url: string;
    isValid: boolean;
    message: string;
    businessNumber: string;
  }> {
    try {
      const organization = await this.getOrganizationData(organizationId);
      const message = this.generateMessage(
        organization.name,
        organization.qr_code_message_template
      );
      const url = this.createWhatsAppURL(
        organization.whatsapp_business_number,
        message
      );

      return {
        url,
        isValid: this.validateWhatsAppNumber(
          organization.whatsapp_business_number
        ),
        message,
        businessNumber: organization.whatsapp_business_number,
      };
    } catch (error) {
      throw new Error(
        `Failed to test WhatsApp link: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
