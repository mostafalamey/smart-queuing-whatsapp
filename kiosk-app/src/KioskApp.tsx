import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Printer,
  Users,
  Clock,
  QrCode,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Ticket,
  Phone,
  MessageSquare,
} from "lucide-react";
import QRCode from "qrcode";

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  whatsapp_business_number: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  current_queue_length: number;
  estimated_wait_time: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  service_name: string;
  customer_phone?: string;
  created_at: string;
  position: number;
}

const KioskApp: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isPrinterReady, setIsPrinterReady] = useState(false);
  const [currentView, setCurrentView] = useState<
    "main" | "services" | "settings" | "qr"
  >("main");
  const [loading, setLoading] = useState(true);
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);

  // Get organization ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get("org");

  useEffect(() => {
    if (orgId) {
      loadOrganizationData();
      loadServices();
      checkPrinterStatus();

      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        loadServices();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [orgId]);

  const loadOrganizationData = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (error) throw error;
      setOrganization(data);
      setIsConnected(true);
    } catch (error) {
      console.error("Error loading organization:", error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select(
          `
          *,
          departments!inner (
            branches!inner (
              organization_id
            )
          )
        `
        )
        .eq("departments.branches.organization_id", orgId)
        .eq("is_active", true);

      if (error) throw error;

      // Calculate queue lengths for each service
      const servicesWithQueue = await Promise.all(
        (data || []).map(async (service) => {
          const { count } = await supabase
            .from("tickets")
            .select("*", { count: "exact" })
            .eq("service_id", service.id)
            .in("status", ["waiting", "called"]);

          return {
            ...service,
            current_queue_length: count || 0,
            estimated_wait_time: calculateWaitTime(count || 0),
          };
        })
      );

      setServices(servicesWithQueue);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const calculateWaitTime = (queueLength: number): string => {
    const avgServiceTime = 15; // minutes
    const totalWait = queueLength * avgServiceTime;

    if (totalWait === 0) return "No wait";
    if (totalWait < 60) return `${totalWait} min`;

    const hours = Math.floor(totalWait / 60);
    const minutes = totalWait % 60;
    return `${hours}h ${minutes}m`;
  };

  const checkPrinterStatus = async () => {
    try {
      // Check if printer is available
      // This would typically involve checking printer connection
      // For now, we'll assume printer is ready if we're in kiosk mode
      setIsPrinterReady(true);
    } catch (error) {
      console.error("Printer check failed:", error);
      setIsPrinterReady(false);
    }
  };

  const generateWhatsAppQR = async (): Promise<string> => {
    if (!organization?.whatsapp_business_number) {
      throw new Error("WhatsApp business number not configured");
    }

    const message = encodeURIComponent(
      `Hello ${organization.name}! I would like to join the queue.`
    );
    const whatsappUrl = `https://wa.me/${organization.whatsapp_business_number.replace(
      /^\+/,
      ""
    )}?text=${message}`;

    return await QRCode.toDataURL(whatsappUrl, {
      width: 300,
      margin: 2,
    });
  };

  const printTicket = async (service: Service, customerPhone?: string) => {
    try {
      // Create ticket in database
      const { data: ticket, error } = await supabase
        .from("tickets")
        .insert({
          service_id: service.id,
          customer_phone: customerPhone || "kiosk-generated",
          status: "waiting",
          created_via: "kiosk",
        })
        .select(
          `
          *,
          services (name)
        `
        )
        .single();

      if (error) throw error;

      // Get queue position
      const { count } = await supabase
        .from("tickets")
        .select("*", { count: "exact" })
        .eq("service_id", service.id)
        .in("status", ["waiting", "called"])
        .lt("created_at", ticket.created_at);

      const position = (count || 0) + 1;
      const ticketData = {
        ...ticket,
        position,
        service_name: ticket.services.name,
      };

      // Print physical ticket
      if (isPrinterReady) {
        await printPhysicalTicket(ticketData);
      }

      setLastTicket(ticketData);

      // Refresh services to update queue lengths
      loadServices();
    } catch (error) {
      console.error("Error printing ticket:", error);
      alert("Error creating ticket. Please try again.");
    }
  };

  const printPhysicalTicket = async (ticket: Ticket) => {
    // This would integrate with actual thermal printer
    // For now, we'll log the ticket details
    console.log("Printing ticket:", ticket);

    const ticketContent = `
=================================
        ${organization?.name}
=================================

Ticket: ${ticket.ticket_number}
Service: ${ticket.service_name}
Position in Queue: ${ticket.position}
Estimated Wait: ${calculateWaitTime(ticket.position)}

Time: ${new Date(ticket.created_at).toLocaleString()}

Scan QR code to get WhatsApp updates:
[QR Code would be printed here]

Thank you for using our service!
=================================
    `;

    // In a real implementation, you would send this to the thermal printer
    alert(`Ticket printed:\n${ticketContent}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading kiosk...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-700 mb-2">
            Connection Error
          </h1>
          <p className="text-red-600">Unable to load organization data</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {organization.logo_url && (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="w-12 h-12 object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {organization.name}
              </h1>
              <p className="text-sm text-gray-500">Queue Management Kiosk</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              {isPrinterReady ? (
                <Printer className="w-5 h-5 text-green-500" />
              ) : (
                <Printer className="w-5 h-5 text-red-500" />
              )}
            </div>

            <button
              onClick={() => setCurrentView("settings")}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === "main" && (
          <MainView
            services={services}
            onPrintTicket={printTicket}
            onShowQR={() => setCurrentView("qr")}
            lastTicket={lastTicket}
          />
        )}

        {currentView === "qr" && (
          <QRView
            organization={organization}
            onBack={() => setCurrentView("main")}
            generateQR={generateWhatsAppQR}
          />
        )}

        {currentView === "settings" && (
          <SettingsView
            organization={organization}
            isPrinterReady={isPrinterReady}
            onBack={() => setCurrentView("main")}
            onCheckPrinter={checkPrinterStatus}
          />
        )}
      </main>
    </div>
  );
};

// Main View Component
interface MainViewProps {
  services: Service[];
  onPrintTicket: (service: Service, phone?: string) => void;
  onShowQR: () => void;
  lastTicket: Ticket | null;
}

const MainView: React.FC<MainViewProps> = ({
  services,
  onPrintTicket,
  onShowQR,
  lastTicket,
}) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="text-center bg-white rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Our Queue System
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Choose your preferred method to join the queue
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={onShowQR}
            className="flex flex-col items-center p-6 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <MessageSquare className="w-12 h-12 text-green-600 mb-3" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              WhatsApp Queue
            </h3>
            <p className="text-green-700 text-center">
              Scan QR code to join via WhatsApp and get real-time updates
            </p>
          </button>

          <div className="flex flex-col items-center p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <Printer className="w-12 h-12 text-blue-600 mb-3" />
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              Print Ticket
            </h3>
            <p className="text-blue-700 text-center">
              Get a physical ticket and monitor your position here
            </p>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Available Services
        </h3>

        <div className="grid gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedService(service)}
            >
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {service.name}
                </h4>
                {service.description && (
                  <p className="text-gray-600">{service.description}</p>
                )}
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{service.current_queue_length} in queue</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>{service.estimated_wait_time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Printed Ticket */}
      {lastTicket && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Last Printed Ticket
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Ticket:</span>{" "}
              {lastTicket.ticket_number}
            </div>
            <div>
              <span className="font-medium">Service:</span>{" "}
              {lastTicket.service_name}
            </div>
            <div>
              <span className="font-medium">Position:</span>{" "}
              {lastTicket.position}
            </div>
            <div>
              <span className="font-medium">Time:</span>{" "}
              {new Date(lastTicket.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Service Selection Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              Print Ticket for {selectedService.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For SMS notifications (optional)
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    onPrintTicket(selectedService, customerPhone);
                    setSelectedService(null);
                    setCustomerPhone("");
                  }}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
                >
                  <Ticket className="w-5 h-5" />
                  <span>Print Ticket</span>
                </button>

                <button
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// QR View Component
interface QRViewProps {
  organization: Organization;
  onBack: () => void;
  generateQR: () => Promise<string>;
}

const QRView: React.FC<QRViewProps> = ({
  organization,
  onBack,
  generateQR,
}) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQR()
      .then(setQrCode)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto text-center">
      <button
        onClick={onBack}
        className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <span>← Back</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <QrCode className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Join Queue via WhatsApp
        </h2>

        <div className="mb-6">
          {loading ? (
            <div className="w-64 h-64 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : qrCode ? (
            <img
              src={qrCode}
              alt="WhatsApp QR Code"
              className="mx-auto rounded-lg shadow-sm"
            />
          ) : (
            <div className="w-64 h-64 bg-red-50 rounded-lg mx-auto flex items-center justify-center">
              <p className="text-red-500">Error generating QR code</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">How it works:</h3>
          <div className="grid gap-4 text-left max-w-md mx-auto">
            <div className="flex space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <p className="text-gray-700">
                Scan the QR code with your phone camera
              </p>
            </div>
            <div className="flex space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <p className="text-gray-700">
                Send the WhatsApp message to start
              </p>
            </div>
            <div className="flex space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <p className="text-gray-700">
                Choose your service and get your ticket
              </p>
            </div>
            <div className="flex space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <p className="text-gray-700">
                Receive real-time updates on WhatsApp
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            <Phone className="w-4 h-4 inline mr-1" />
            WhatsApp: {organization.whatsapp_business_number}
          </p>
        </div>
      </div>
    </div>
  );
};

// Settings View Component
interface SettingsViewProps {
  organization: Organization;
  isPrinterReady: boolean;
  onBack: () => void;
  onCheckPrinter: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  organization,
  isPrinterReady,
  onBack,
  onCheckPrinter,
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <span>← Back</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Kiosk Settings
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Organization
            </h3>
            <div className="grid gap-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {organization.name}
              </div>
              <div>
                <span className="font-medium">ID:</span> {organization.id}
              </div>
              <div>
                <span className="font-medium">WhatsApp:</span>{" "}
                {organization.whatsapp_business_number}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Printer Status
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer
                  className={`w-5 h-5 ${
                    isPrinterReady ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className={isPrinterReady ? "text-green-700" : "text-red-700"}
                >
                  {isPrinterReady ? "Ready" : "Not Connected"}
                </span>
              </div>
              <button
                onClick={onCheckPrinter}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Check Printer
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              System Info
            </h3>
            <div className="grid gap-2 text-sm">
              <div>
                <span className="font-medium">Version:</span> 2.0.0
              </div>
              <div>
                <span className="font-medium">Mode:</span> Kiosk
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KioskApp;
