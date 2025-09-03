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
  Eye,
  Copy,
  QrCode,
  Phone,
} from "lucide-react";

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
    | "phoneNumberRequest"
    | "ticketConfirmation"
    | "statusUpdate"
    | "invalidInput"
    | "systemError"
    | "ticketCreated"
    | "youAreNext"
    | "yourTurn"
  >("qrCodeMessage");
  const [showPreview, setShowPreview] = useState(false);

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
        phoneNumberRequest: "Phone Number Request",
        ticketConfirmation: "Ticket Confirmation",
        statusUpdate: "Status Update",
        invalidInput: "Invalid Input",
        systemError: "System Error",
      },
    },
    queueNotifications: {
      label: "Queue Status Notifications",
      templates: {
        ticketCreated: "Ticket Created",
        youAreNext: "You Are Next",
        yourTurn: "Your Turn",
      },
    },
  };

  // Sample data for preview
  const sampleData: MessageTemplateData = {
    organizationName,
    ticketNumber: "BAK-001",
    serviceName: "Fresh Bread Counter",
    departmentName: "Bakery",
    branchName: "Downtown Branch",
    customerName: "John Doe",
    estimatedWaitTime: "15 min",
    queuePosition: 3,
    totalInQueue: 8,
    currentlyServing: "BAK-256",
    branchList:
      "1️⃣ Downtown Branch\n   📍 123 Main St\n2️⃣ Mall Location\n   📍 456 Shopping Center",
    departmentList: "1️⃣ Bakery\n2️⃣ Deli Counter\n3️⃣ Fresh Produce",
    serviceList:
      "1️⃣ Fresh Bread Counter (5 min)\n2️⃣ Custom Cake Orders (15 min)\n3️⃣ Pastry Selection (3 min)",
  };

  useEffect(() => {
    loadTemplates();
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
    } else if (
      ["ticketCreated", "youAreNext", "yourTurn"].includes(activeTemplate)
    ) {
      return (
        (
          templates[
            activeTemplate as keyof Pick<
              MessageTemplates,
              "ticketCreated" | "youAreNext" | "yourTurn"
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

    if (["ticketCreated", "youAreNext", "yourTurn"].includes(templateKey)) {
      if (!newTemplates[templateKey as keyof MessageTemplates]) {
        (newTemplates[templateKey as keyof MessageTemplates] as any) = {
          whatsapp: "",
          push: { title: "", body: "" },
        };
      }
      (
        newTemplates[
          templateKey as keyof Pick<
            MessageTemplates,
            "ticketCreated" | "youAreNext" | "yourTurn"
          >
        ] as any
      ).whatsapp = value;
    } else {
      (newTemplates[templateKey as keyof MessageTemplates] as any) = value;
    }

    setTemplates(newTemplates);
  };

  const generatePreview = () => {
    const template = getCurrentTemplate();
    return processMessageTemplate(template, sampleData);
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
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              WhatsApp Customer Experience
            </h1>
            <p className="text-gray-600">
              Configure your WhatsApp-first queue management messages
            </p>
          </div>
        </div>
        <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">
            🎯 WhatsApp-First Journey:
          </h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <strong>1. Scan QR</strong> → Opens WhatsApp with welcome message
            </p>
            <p>
              <strong>2. Send Message</strong> → Gets branch/department/service
              menu
            </p>
            <p>
              <strong>3. Select Service</strong> → Gets phone number
              confirmation
            </p>
            <p>
              <strong>4. Confirm Phone</strong> → Receives ticket with queue
              position
            </p>
            <p>
              <strong>5. Stay Updated</strong> → All status updates via WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* Template Categories */}
      {Object.entries(templateCategories).map(([categoryKey, category]) => (
        <div
          key={categoryKey}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {categoryKey === "whatsappConversation" ? (
                <QrCode className="h-6 w-6 text-green-600" />
              ) : (
                <MessageSquare className="h-6 w-6 text-blue-600" />
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {category.label}
              </h2>
            </div>
            {categoryKey === "whatsappConversation" && (
              <div className="flex space-x-3">
                <button
                  onClick={resetToDefaults}
                  disabled={!canEditMessages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center space-x-2 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset to Defaults</span>
                </button>
                <button
                  onClick={saveTemplates}
                  disabled={saving || !canEditMessages}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Saving..." : "Save WhatsApp Messages"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Template Selection Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 flex-wrap">
                {Object.entries(category.templates).map(
                  ([templateKey, label]) => (
                    <button
                      key={templateKey}
                      onClick={() => setActiveTemplate(templateKey as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTemplate === templateKey
                          ? categoryKey === "whatsappConversation"
                            ? "border-green-500 text-green-600"
                            : "border-blue-500 text-blue-600"
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
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-medium text-green-900 mb-2">
                    QR Code WhatsApp Message
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
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
                    className={`w-full px-3 py-2 border border-green-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 resize-none ${
                      !canEditMessages
                        ? "bg-gray-50 cursor-not-allowed text-gray-700"
                        : ""
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Edit WhatsApp Message Template
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
                        rows={12}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm ${
                          !canEditMessages
                            ? "bg-gray-50 cursor-not-allowed text-gray-700"
                            : ""
                        }`}
                        placeholder="Enter your WhatsApp message template..."
                      />
                    </div>

                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        Available Variables:
                      </h4>
                      <div className="text-xs text-yellow-700 grid grid-cols-2 gap-1">
                        <code>{"{{organizationName}}"}</code>
                        <code>{"{{ticketNumber}}"}</code>
                        <code>{"{{serviceName}}"}</code>
                        <code>{"{{departmentName}}"}</code>
                        <code>{"{{branchName}}"}</code>
                        <code>{"{{estimatedWaitTime}}"}</code>
                        <code>{"{{queuePosition}}"}</code>
                        <code>{"{{totalInQueue}}"}</code>
                        <code>{"{{currentlyServing}}"}</code>
                        <code>{"{{branchList}}"}</code>
                        <code>{"{{departmentList}}"}</code>
                        <code>{"{{serviceList}}"}</code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Live Preview
                      </h3>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>{showPreview ? "Hide" : "Show"} Preview</span>
                      </button>
                    </div>

                    {showPreview && (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              WhatsApp Message Preview:
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(generatePreview() as string)
                              }
                              className="text-green-600 hover:text-green-800"
                              title="Copy preview to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="bg-white border rounded-lg p-3 whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                            {generatePreview() as string}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-gray-600">
                      <p>
                        <strong>Sample data used in preview:</strong>
                      </p>
                      <ul className="mt-2 space-y-1 text-xs bg-gray-50 p-3 rounded-md">
                        <li>
                          <strong>Organization:</strong>{" "}
                          {sampleData.organizationName}
                        </li>
                        <li>
                          <strong>Ticket:</strong> {sampleData.ticketNumber}
                        </li>
                        <li>
                          <strong>Service:</strong> {sampleData.serviceName}
                        </li>
                        <li>
                          <strong>Department:</strong>{" "}
                          {sampleData.departmentName}
                        </li>
                        <li>
                          <strong>Branch:</strong> {sampleData.branchName}
                        </li>
                        <li>
                          <strong>Queue Position:</strong>{" "}
                          {sampleData.queuePosition} of{" "}
                          {sampleData.totalInQueue}
                        </li>
                        <li>
                          <strong>Estimated Wait:</strong>{" "}
                          {sampleData.estimatedWaitTime}
                        </li>
                        <li>
                          <strong>Currently Serving:</strong>{" "}
                          {sampleData.currentlyServing}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* WhatsApp Flow Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          📱 WhatsApp Customer Journey Flow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              Conversation Flow Messages:
            </h4>
            <ul className="space-y-2 text-blue-700">
              <li>
                <strong>QR Code Message:</strong> Pre-filled when scanning QR
              </li>
              <li>
                <strong>Welcome Message:</strong> First response from system
              </li>
              <li>
                <strong>Branch Selection:</strong> If multiple branches exist
              </li>
              <li>
                <strong>Department Selection:</strong> Choose department
              </li>
              <li>
                <strong>Service Selection:</strong> Pick specific service
              </li>
              <li>
                <strong>Phone Number Request:</strong> Confirm customer phone
              </li>
              <li>
                <strong>Ticket Confirmation:</strong> Final ticket details
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              Status Update Messages:
            </h4>
            <ul className="space-y-2 text-blue-700">
              <li>
                <strong>Status Update:</strong> When customer checks position
              </li>
              <li>
                <strong>Invalid Input:</strong> When customer sends wrong format
              </li>
              <li>
                <strong>System Error:</strong> When technical issues occur
              </li>
              <li>
                <strong>Ticket Created:</strong> Initial queue notification
              </li>
              <li>
                <strong>You Are Next:</strong> One before their turn
              </li>
              <li>
                <strong>Your Turn:</strong> Time to be served
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
