import React, { useState, useEffect } from "react";
import { useAppToast } from "@/hooks/useAppToast";
import { supabase } from "@/lib/supabase";
import {
  defaultMessageTemplates,
  processMessageTemplate,
  type MessageTemplates,
  type MessageTemplateData,
} from "../../../../../../shared/message-templates";
import {
  MessageSquare,
  Save,
  RotateCcw,
  Copy,
  QrCode,
  Phone,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address: string;
}

interface Department {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  estimated_time?: number; // Fallback from services table
  calculated_duration?: number; // Calculated from analytics
}

interface MessageTemplateManagementProps {
  organizationId: string;
  organizationName: string;
  qrCodeTemplate: string;
  onUpdateQrCodeTemplate: (message: string) => Promise<void>;
  canEditMessages: boolean;
}

export function MessageTemplateManagement({
  organizationId,
  organizationName,
  qrCodeTemplate,
  onUpdateQrCodeTemplate,
  canEditMessages,
}: MessageTemplateManagementProps) {
  const { showSuccess, showError, showInfo } = useAppToast();
  const [templates, setTemplates] = useState<MessageTemplates>(
    defaultMessageTemplates
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<
    | "qrCodeMessage"
    | "welcomeMessage"
    | "branchSelection"
    | "departmentSelection"
    | "serviceSelection"
    | "ticketConfirmation"
    | "statusUpdate"
    | "invalidInput"
    | "systemError"
    | "youAreNext"
    | "yourTurn"
  >("qrCodeMessage");

  // Organization data for realistic previews
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingOrgData, setLoadingOrgData] = useState(false);

  // Local QR code template state with debounced updates
  const [localQrCodeTemplate, setLocalQrCodeTemplate] =
    useState(qrCodeTemplate);
  const [qrCodeTemplateTimeout, setQrCodeTemplateTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Template categories and labels for the new WhatsApp-first system
  const templateCategories = {
    whatsappConversation: {
      label: "WhatsApp Conversation Flow",
      templates: {
        qrCodeMessage: "QR Code Message",
        welcomeMessage: "Welcome Message",
        branchSelection: "Branch Selection",
        departmentSelection: "Department Selection",
        serviceSelection: "Service Selection",
        ticketConfirmation: "Ticket Confirmation",
        statusUpdate: "Status Update",
        invalidInput: "Invalid Input",
        systemError: "System Error",
      },
    },
    queueNotifications: {
      label: "Queue Status Notifications",
      templates: {
        youAreNext: "You Are Next",
        yourTurn: "Your Turn",
      },
    },
  };

  // Sample data for preview with real organization data
  const getSampleData = (): MessageTemplateData => {
    // Build realistic branch list from actual data
    const branchList =
      branches.length > 0
        ? branches
            .map(
              (branch, index) =>
                `${index + 1}️⃣ ${branch.name}${
                  branch.address ? `\n   📍 ${branch.address}` : ""
                }`
            )
            .join("\n")
        : "1️⃣ Downtown Branch\n   📍 123 Main St\n2️⃣ Mall Location\n   📍 456 Shopping Center";

    // Build realistic department list from actual data
    const departmentList =
      departments.length > 0
        ? departments
            .map((dept, index) => `${index + 1}️⃣ ${dept.name}`)
            .join("\n")
        : "1️⃣ Bakery\n2️⃣ Deli Counter\n3️⃣ Fresh Produce";

    // Build realistic service list from actual data
    const serviceList =
      services.length > 0
        ? services
            .map(
              (service, index) =>
                `${index + 1}️⃣ ${service.name}${
                  service.calculated_duration
                    ? ` (${service.calculated_duration} min)`
                    : ""
                }`
            )
            .join("\n")
        : "1️⃣ Fresh Bread Counter (5 min)\n2️⃣ Custom Cake Orders (15 min)\n3️⃣ Pastry Selection (3 min)";

    return {
      organizationName,
      ticketNumber: "QUE-001",
      serviceName: services[0]?.name || "General Service",
      departmentName: departments[0]?.name || "Customer Service",
      branchName: branches[0]?.name || "Main Branch",
      customerName: "John Doe",
      estimatedWaitTime: "15 min",
      queuePosition: 3,
      totalInQueue: 8,
      currentlyServing: "QUE-256",
      branchList,
      departmentList,
      serviceList,
    };
  };

  useEffect(() => {
    loadTemplates();
    loadOrganizationData();
  }, [organizationId]);

  // Sync local QR code template with prop
  useEffect(() => {
    setLocalQrCodeTemplate(qrCodeTemplate);
  }, [qrCodeTemplate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (qrCodeTemplateTimeout) {
        clearTimeout(qrCodeTemplateTimeout);
      }
    };
  }, [qrCodeTemplateTimeout]);

  const loadOrganizationData = async () => {
    try {
      setLoadingOrgData(true);

      // Load branches
      const { data: branchData, error: branchError } = await supabase
        .from("branches")
        .select("id, name, address")
        .eq("organization_id", organizationId)
        .order("name");

      if (branchError) {
        console.error("Error loading branches:", branchError);
      } else {
        setBranches(branchData || []);
      }

      // Load departments (from first branch if available)
      if (branchData && branchData.length > 0) {
        const { data: deptData, error: deptError } = await supabase
          .from("departments")
          .select("id, name")
          .eq("branch_id", branchData[0].id)
          .order("name");

        if (deptError) {
          console.error("Error loading departments:", deptError);
        } else {
          setDepartments(deptData || []);
        }

        // Load services (from first department if available)
        if (deptData && deptData.length > 0) {
          const { data: serviceData, error: serviceError } = await supabase
            .from("services")
            .select("id, name, estimated_time")
            .eq("department_id", deptData[0].id)
            .order("name");

          if (serviceError) {
            console.error("Error loading services:", serviceError);
            setServices([]);
          } else {
            // Calculate estimated duration from analytics for each service
            const servicesWithDuration = await Promise.all(
              (serviceData || []).map(async (service) => {
                try {
                  // Try to get average duration from analytics
                  const { data: analyticsData } = await supabase
                    .from("queue_analytics")
                    .select("avg_service_time")
                    .eq("service_id", service.id)
                    .eq("status", "completed")
                    .gte(
                      "created_at",
                      new Date(
                        Date.now() - 30 * 24 * 60 * 60 * 1000
                      ).toISOString()
                    ) // Last 30 days
                    .single();

                  const calculated_duration = analyticsData?.avg_service_time
                    ? Math.round(analyticsData.avg_service_time / 60) // Convert seconds to minutes
                    : service.estimated_time || 15; // Fallback to service estimated_time or default 15 min

                  return {
                    ...service,
                    calculated_duration,
                  };
                } catch (error) {
                  // If analytics query fails, use fallback
                  return {
                    ...service,
                    calculated_duration: service.estimated_time || 15,
                  };
                }
              })
            );

            setServices(servicesWithDuration);
          }
        }
      }
    } catch (error) {
      console.error("Error loading organization data:", error);
    } finally {
      setLoadingOrgData(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);

      // Try to load custom templates from database
      const { data: customTemplates, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        throw error;
      }

      if (customTemplates?.templates) {
        setTemplates(customTemplates.templates);
      } else {
        // Use default templates
        setTemplates(defaultMessageTemplates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      showError("Failed to load message templates");
      setTemplates(defaultMessageTemplates);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplates = async () => {
    try {
      setSaving(true);

      // Upsert the templates with proper conflict resolution
      const { error } = await supabase.from("message_templates").upsert(
        {
          organization_id: organizationId,
          templates: templates,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "organization_id",
          ignoreDuplicates: false,
        }
      );

      if (error) throw error;

      showSuccess("WhatsApp message templates saved successfully!");
    } catch (error) {
      console.error("Error saving templates:", error);
      showError("Failed to save message templates");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setTemplates(defaultMessageTemplates);
    showInfo("Templates reset to defaults. Remember to save your changes.");
  };

  const handleQrCodeTemplateChange = (message: string) => {
    setLocalQrCodeTemplate(message);

    // Clear existing timeout
    if (qrCodeTemplateTimeout) {
      clearTimeout(qrCodeTemplateTimeout);
    }

    // Set new timeout for debounced update
    const newTimeout = setTimeout(() => {
      onUpdateQrCodeTemplate(message);
    }, 1000); // 1 second delay

    setQrCodeTemplateTimeout(newTimeout);
  };

  const getCurrentTemplate = () => {
    if (activeTemplate === "qrCodeMessage") {
      return localQrCodeTemplate;
    } else if (["youAreNext", "yourTurn"].includes(activeTemplate)) {
      return (
        (
          templates[
            activeTemplate as keyof Pick<
              MessageTemplates,
              "youAreNext" | "yourTurn"
            >
          ] as any
        )?.whatsapp || ""
      );
    } else {
      return (
        (templates[activeTemplate as keyof MessageTemplates] as string) || ""
      );
    }
  };

  const updateTemplate = (
    templateKey: string,
    field: string,
    value: string
  ) => {
    if (!canEditMessages) return;

    if (templateKey === "qrCodeMessage") {
      handleQrCodeTemplateChange(value);
      return;
    }

    const newTemplates = { ...templates };

    if (["youAreNext", "yourTurn"].includes(templateKey)) {
      if (!newTemplates[templateKey as keyof MessageTemplates]) {
        (newTemplates[templateKey as keyof MessageTemplates] as any) = {
          whatsapp: "",
          push: { title: "", body: "" },
        };
      }
      (
        newTemplates[
          templateKey as keyof Pick<MessageTemplates, "youAreNext" | "yourTurn">
        ] as any
      ).whatsapp = value;
    } else {
      (newTemplates[templateKey as keyof MessageTemplates] as any) = value;
    }

    setTemplates(newTemplates);
  };

  const generatePreview = () => {
    const template = getCurrentTemplate();
    const sampleData = getSampleData();
    return processMessageTemplate(template, sampleData);
  };

  const renderWhatsAppPreview = (message: string) => {
    // Convert WhatsApp formatting to HTML for better preview
    return message.split("\n").map((line, index) => {
      // Convert *text* to bold
      let formattedLine = line.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");

      // Convert emoji numbering to styled bullets
      formattedLine = formattedLine.replace(
        /^([0-9]️⃣)/g,
        '<span class="text-blue-600 font-bold">$1</span>'
      );

      return (
        <div key={index} className="leading-relaxed">
          {formattedLine.includes("<") ? (
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          ) : (
            formattedLine
          )}
        </div>
      );
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess("Copied to clipboard!");
    } catch (error) {
      showError("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        {/* Main Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-gradient-primary p-3 rounded-xl shadow-lg">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              WhatsApp Customer Experience
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Configure your WhatsApp-first queue management messages
            </p>
          </div>
        </div>

        {/* Journey Overview Card */}
        <div className="bg-gradient-to-br from-celestial-50 to-french-50 rounded-xl p-6 border border-celestial-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🎯</span>
            <h3 className="text-xl font-bold text-celestial-900">
              WhatsApp-First Customer Journey
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3">
              <div className="bg-celestial-100 rounded-full p-2 mt-1">
                <span className="text-celestial-700 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-semibold text-celestial-800">Scan QR</p>
                <p className="text-sm text-celestial-600">
                  Opens WhatsApp with welcome message
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-celestial-100 rounded-full p-2 mt-1">
                <span className="text-celestial-700 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-semibold text-celestial-800">Send Message</p>
                <p className="text-sm text-celestial-600">
                  Gets branch/department/service menu
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-celestial-100 rounded-full p-2 mt-1">
                <span className="text-celestial-700 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-semibold text-celestial-800">
                  Select Service
                </p>
                <p className="text-sm text-celestial-600">
                  Gets ticket confirmation immediately
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-celestial-100 rounded-full p-2 mt-1">
                <span className="text-celestial-700 font-bold text-sm">4</span>
              </div>
              <div>
                <p className="font-semibold text-celestial-800">Stay Updated</p>
                <p className="text-sm text-celestial-600">
                  All status updates via WhatsApp
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/70 rounded-lg border border-celestial-200">
            <p className="text-celestial-700 font-medium flex items-center space-x-2">
              <span>📱</span>
              <span>Phone number automatically detected from WhatsApp!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Template Categories */}
      {Object.entries(templateCategories).map(([categoryKey, category]) => (
        <div
          key={categoryKey}
          className="bg-white rounded-xl shadow-elegant border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    categoryKey === "whatsappConversation"
                      ? "bg-celestial-100"
                      : "bg-french-100"
                  }`}
                >
                  {categoryKey === "whatsappConversation" ? (
                    <QrCode className="h-6 w-6 text-celestial-600" />
                  ) : (
                    <MessageSquare className="h-6 w-6 text-french-600" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {category.label}
                </h2>
              </div>
              {categoryKey === "whatsappConversation" && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={resetToDefaults}
                    disabled={!canEditMessages}
                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-celestial-500 flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors duration-200"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset to Defaults</span>
                    <span className="sm:hidden">Reset</span>
                  </button>
                  <button
                    onClick={saveTemplates}
                    disabled={saving || !canEditMessages}
                    className="px-3 sm:px-4 py-2 bg-gradient-primary border border-transparent rounded-lg text-sm font-medium text-white hover:shadow-glow-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-celestial-500 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all duration-200 shadow-elegant"
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {saving ? "Saving..." : "Save WhatsApp Messages"}
                    </span>
                    <span className="sm:hidden">
                      {saving ? "Saving..." : "Save"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Template Selection Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-3 sm:space-x-6 flex-wrap gap-y-2">
                  {Object.entries(category.templates).map(
                    ([templateKey, label]) => (
                      <button
                        key={templateKey}
                        onClick={() => setActiveTemplate(templateKey as any)}
                        className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 ${
                          activeTemplate === templateKey
                            ? categoryKey === "whatsappConversation"
                              ? "border-celestial-500 text-celestial-600"
                              : "border-french-500 text-french-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </nav>
              </div>
            </div>

            {/* Show editor only for active category */}
            {Object.keys(category.templates).includes(activeTemplate) && (
              <>
                {/* Special handling for QR Code Template */}
                {activeTemplate === "qrCodeMessage" && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-celestial-50 to-celestial-100/50 border border-celestial-200 rounded-lg">
                    <h3 className="text-lg font-medium text-celestial-900 mb-2">
                      QR Code WhatsApp Message
                    </h3>
                    <p className="text-sm text-celestial-700 mb-4">
                      This message appears when customers scan your QR code. It
                      opens WhatsApp with this pre-filled message.
                    </p>
                    <textarea
                      value={localQrCodeTemplate}
                      onChange={(e) => {
                        if (canEditMessages) {
                          handleQrCodeTemplateChange(e.target.value);
                        }
                      }}
                      disabled={!canEditMessages}
                      rows={2}
                      className={`w-full px-3 py-2 border border-celestial-300 rounded-lg shadow-sm focus:ring-2 focus:ring-celestial-500 focus:border-celestial-500 resize-none transition-all duration-200 ${
                        !canEditMessages
                          ? "bg-gray-50 cursor-not-allowed text-gray-700"
                          : "bg-white"
                      }`}
                      placeholder="Hello {{organizationName}}! I would like to join the queue."
                    />
                    {!canEditMessages && (
                      <p className="text-xs text-gray-500 mt-2">
                        You don't have permission to edit messages. Contact your
                        administrator.
                      </p>
                    )}
                  </div>
                )}

                {/* Template Editor */}
                {activeTemplate !== "qrCodeMessage" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-celestial-500 rounded-full"></span>
                        <span className="text-sm sm:text-base">
                          Edit WhatsApp Message Template
                        </span>
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message Content
                        </label>
                        <textarea
                          value={getCurrentTemplate() as string}
                          onChange={(e) =>
                            updateTemplate(
                              activeTemplate,
                              "whatsapp",
                              e.target.value
                            )
                          }
                          disabled={!canEditMessages}
                          rows={10}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-celestial-500 focus:border-celestial-500 font-mono text-xs sm:text-sm resize-none transition-all duration-200 shadow-sm ${
                            !canEditMessages
                              ? "bg-gray-50 cursor-not-allowed text-gray-700"
                              : "bg-white"
                          }`}
                          placeholder="Enter your WhatsApp message template..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <span className="w-2 h-2 bg-french-500 rounded-full"></span>
                        <span className="text-sm sm:text-base">
                          Live Preview
                        </span>
                      </h3>

                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-lg p-3 sm:p-4 min-h-[200px] shadow-sm">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs sm:text-sm font-medium text-gray-600 flex items-center space-x-1">
                              <span>📱</span>
                              <span className="hidden sm:inline">
                                WhatsApp Message Preview:
                              </span>
                              <span className="sm:hidden">Preview:</span>
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(generatePreview() as string)
                              }
                              className="text-celestial-600 hover:text-celestial-800 p-1 rounded hover:bg-celestial-50 transition-colors duration-200"
                              title="Copy preview to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm max-h-64 overflow-y-auto shadow-inner">
                            {renderWhatsAppPreview(generatePreview() as string)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Variables Section - Full Width Below Templates */}
                {activeTemplate !== "qrCodeMessage" && (
                  <div className="mt-6 p-3 sm:p-4 bg-gradient-to-r from-citrine-50 to-caramel-50 border border-citrine-200 rounded-lg shadow-sm">
                    <h4 className="text-sm font-semibold text-citrine-800 mb-3 flex items-center space-x-2">
                      <span>🏷️</span>
                      <span>Available Variables:</span>
                    </h4>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{organizationName}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{ticketNumber}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{serviceName}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{departmentName}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{branchName}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{estimatedWaitTime}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{queuePosition}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{totalInQueue}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{currentlyServing}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{branchList}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{departmentList}}"}
                      </code>
                      <code className="text-xs bg-citrine-100 text-citrine-800 px-2 py-1 rounded font-mono shadow-sm break-all">
                        {"{{serviceList}}"}
                      </code>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}

      {/* WhatsApp Flow Information */}
      <div className="bg-gradient-to-br from-celestial-50 to-french-50 border border-celestial-200 rounded-xl p-6 shadow-elegant">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">📱</span>
          <h3 className="text-xl font-bold text-celestial-900">
            WhatsApp Customer Journey Flow
          </h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/60 rounded-lg p-4 border border-celestial-100 shadow-sm">
            <h4 className="font-bold text-celestial-800 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-celestial-500 rounded-full"></span>
              <span>Conversation Flow Messages</span>
            </h4>
            <ul className="space-y-2 text-sm text-celestial-700">
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">
                  QR Code Message:
                </strong>
                <span className="text-celestial-600">
                  Pre-filled when scanning QR
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">
                  Welcome Message:
                </strong>
                <span className="text-celestial-600">
                  First response from system
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">
                  Branch Selection:
                </strong>
                <span className="text-celestial-600">
                  If multiple branches exist
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">
                  Department Selection:
                </strong>
                <span className="text-celestial-600">Choose department</span>
              </li>
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">
                  Service Selection:
                </strong>
                <span className="text-celestial-600">
                  Pick specific service
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">
                  Ticket Confirmation:
                </strong>
                <span className="text-celestial-600">
                  Immediate ticket creation (phone auto-detected)
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-white/60 rounded-lg p-4 border border-french-100 shadow-sm">
            <h4 className="font-bold text-french-800 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-french-500 rounded-full"></span>
              <span>Status Update Messages</span>
            </h4>
            <ul className="space-y-2 text-sm text-french-700">
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">
                  Status Update:
                </strong>
                <span className="text-french-600">
                  When customer checks position
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">
                  Invalid Input:
                </strong>
                <span className="text-french-600">
                  When customer sends wrong format
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">System Error:</strong>
                <span className="text-french-600">
                  When technical issues occur
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">You Are Next:</strong>
                <span className="text-french-600">One before their turn</span>
              </li>
              <li className="flex items-start space-x-2">
                <strong className="min-w-0 font-semibold">Your Turn:</strong>
                <span className="text-french-600">Time to be served</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
