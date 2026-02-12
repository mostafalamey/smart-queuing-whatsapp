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
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  whatsapp_business_number: string;
}

interface Branch {
  id: string;
  name: string;
  address?: string;
}

interface Department {
  id: string;
  name: string;
  branch_id: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  department_id: string;
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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isPrinterReady, setIsPrinterReady] = useState(false);
  const [currentView, setCurrentView] = useState<
    "branches" | "departments" | "services" | "settings" | "qr"
  >("branches");
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);

  // Get organization ID from URL params or environment variable
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get("org") || import.meta.env.VITE_ORGANIZATION_ID;
  const branchIdParam = urlParams.get("branch");
  const departmentIdParam = urlParams.get("department");

  useEffect(() => {
    if (!orgId) {
      setIsConnected(false);
      setLoading(false);
      return;
    }

    const initialize = async () => {
      await loadOrganizationData();
      checkPrinterStatus();

      if (departmentIdParam) {
        const department = await loadDepartmentById(departmentIdParam);
        if (department) {
          setSelectedDepartment(department);
          await loadServices(department.id);
          setCurrentView("services");
          return;
        }
      }

      if (branchIdParam) {
        const branch = await loadBranchById(branchIdParam);
        if (branch) {
          setSelectedBranch(branch);
          await loadDepartments(branch.id);
          setCurrentView("departments");
          return;
        }
      }

      await loadBranches();
      setCurrentView("branches");
    };

    void initialize();
  }, [orgId, branchIdParam, departmentIdParam]);

  useEffect(() => {
    if (!selectedDepartment) return;

    const interval = setInterval(() => {
      loadServices(selectedDepartment.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedDepartment]);

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

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("organization_id", orgId);

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error("Error loading branches:", error);
    }
  };

  const loadBranchById = async (branchId: string): Promise<Branch | null> => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", branchId)
        .single();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error("Error loading branch:", error);
      return null;
    }
  };

  const loadDepartments = async (branchId: string) => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("branch_id", branchId);

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadDepartmentById = async (
    departmentId: string,
  ): Promise<Department | null> => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", departmentId)
        .single();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error("Error loading department:", error);
      return null;
    }
  };

  const loadServices = async (departmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("department_id", departmentId)
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
        }),
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
      `Hello ${organization.name}! I would like to join the queue.`,
    );
    const whatsappUrl = `https://wa.me/${organization.whatsapp_business_number.replace(
      /^\+/,
      "",
    )}?text=${message}`;

    return await QRCode.toDataURL(whatsappUrl, {
      width: 300,
      margin: 2,
    });
  };

  const printTicket = async (service: Service, phone: string) => {
    try {
      // Create ticket in database using atomic RPC
      const { data: ticket, error } = await supabase
        .rpc("create_ticket_for_service", {
          p_service_id: service.id,
          p_customer_phone: phone,
          p_created_via: "kiosk",
        })
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
        service_name: service.name,
      };

      // Print physical ticket
      if (isPrinterReady) {
        await printPhysicalTicket(ticketData);
      }

      setLastTicket(ticketData);

      // Refresh services to update queue lengths
      if (selectedDepartment) {
        loadServices(selectedDepartment.id);
      }
    } catch (error) {
      console.error("Error printing ticket:", error);
      alert("Error creating ticket. Please try again.");
    }
  };

  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedDepartment(null);
    setSelectedService(null);
    setCustomerPhone("");
    setPhoneError("");
    await loadDepartments(branch.id);
    setCurrentView("departments");
  };

  const handleDepartmentSelect = async (department: Department) => {
    setSelectedDepartment(department);
    setSelectedService(null);
    setCustomerPhone("");
    setPhoneError("");
    await loadServices(department.id);
    setCurrentView("services");
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCustomerPhone("");
    setPhoneError("");
  };

  const handlePrintConfirm = async () => {
    if (!selectedService) return;
    const trimmedPhone = customerPhone.trim();
    if (!trimmedPhone) {
      setPhoneError("Phone number is required.");
      return;
    }

    setPhoneError("");
    await printTicket(selectedService, trimmedPhone);
    setSelectedService(null);
    setCustomerPhone("");
  };

  const handleBack = () => {
    if (currentView === "services") {
      setSelectedDepartment(null);
      setServices([]);
      setCurrentView("departments");
      return;
    }

    if (currentView === "departments") {
      setSelectedBranch(null);
      setDepartments([]);
      setCurrentView("branches");
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
    <div className="kiosk-shell">
      <header className="kiosk-topbar">
        <div className="kiosk-brand">
          {organization.logo_url && (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="kiosk-logo"
            />
          )}
          <div>
            <p className="kiosk-brand-kicker">Queue Management Kiosk</p>
            <h1 className="kiosk-brand-title">{organization.name}</h1>
          </div>
        </div>

        <div className="kiosk-status">
          <div className="kiosk-pill">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-emerald-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-rose-500" />
            )}
            <span>{isConnected ? "Online" : "Offline"}</span>
          </div>
          <div className="kiosk-pill">
            {isPrinterReady ? (
              <Printer className="w-4 h-4 text-emerald-600" />
            ) : (
              <Printer className="w-4 h-4 text-rose-500" />
            )}
            <span>{isPrinterReady ? "Printer Ready" : "Printer Offline"}</span>
          </div>
          <button
            onClick={() => setCurrentView("settings")}
            className="kiosk-icon-button"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <main className="kiosk-main">
        {currentView === "branches" && (
          <BranchesView
            branches={branches}
            onSelectBranch={handleBranchSelect}
            onShowQR={() => setCurrentView("qr")}
            lastTicket={lastTicket}
          />
        )}

        {currentView === "departments" && selectedBranch && (
          <DepartmentsView
            branch={selectedBranch}
            departments={departments}
            onSelectDepartment={handleDepartmentSelect}
            onBack={handleBack}
          />
        )}

        {currentView === "services" && selectedDepartment && (
          <ServicesView
            department={selectedDepartment}
            services={services}
            onSelectService={handleServiceSelect}
            onBack={handleBack}
          />
        )}

        {currentView === "qr" && (
          <QRView
            organization={organization}
            onBack={() => setCurrentView("branches")}
            generateQR={generateWhatsAppQR}
          />
        )}

        {currentView === "settings" && (
          <SettingsView
            organization={organization}
            isPrinterReady={isPrinterReady}
            onBack={() => setCurrentView("branches")}
            onCheckPrinter={checkPrinterStatus}
          />
        )}
      </main>

      {selectedService && (
        <PrintTicketModal
          service={selectedService}
          customerPhone={customerPhone}
          phoneError={phoneError}
          onChangePhone={(value) => {
            setCustomerPhone(value);
            if (phoneError) setPhoneError("");
          }}
          onCancel={() => setSelectedService(null)}
          onConfirm={handlePrintConfirm}
        />
      )}
    </div>
  );
};

// Branches View Component
interface BranchesViewProps {
  branches: Branch[];
  onSelectBranch: (branch: Branch) => void;
  onShowQR: () => void;
  lastTicket: Ticket | null;
}

const BranchesView: React.FC<BranchesViewProps> = ({
  branches,
  onSelectBranch,
  onShowQR,
  lastTicket,
}) => {
  return (
    <div className="kiosk-view">
      <div className="kiosk-stepbar">
        <div>
          <p className="kiosk-step-label">Step 1 of 3</p>
          <h2 className="kiosk-title">Choose a branch</h2>
          <p className="kiosk-subtitle">Tap a branch to continue.</p>
        </div>
        <div className="kiosk-step-hint">
          <Users className="w-4 h-4 text-teal-700" />
          <span>Touch-friendly selection</span>
        </div>
      </div>

      <div className="kiosk-grid">
        <section className="kiosk-panel kiosk-panel-accent">
          <div className="kiosk-panel-title">Quick actions</div>
          <button
            onClick={onShowQR}
            className="kiosk-choice kiosk-choice-accent"
          >
            <div>
              <div className="kiosk-choice-title">Join by WhatsApp</div>
              <div className="kiosk-choice-meta">
                Scan the QR code to receive updates on your phone.
              </div>
            </div>
            <MessageSquare className="w-6 h-6 text-teal-700" />
          </button>

          {lastTicket && (
            <div className="kiosk-ticket-card">
              <div className="kiosk-panel-title">Last ticket</div>
              <div className="kiosk-ticket-grid">
                <div>
                  <span className="kiosk-ticket-label">Ticket</span>
                  <div className="kiosk-ticket-value">
                    {lastTicket.ticket_number}
                  </div>
                </div>
                <div>
                  <span className="kiosk-ticket-label">Service</span>
                  <div className="kiosk-ticket-value">
                    {lastTicket.service_name}
                  </div>
                </div>
                <div>
                  <span className="kiosk-ticket-label">Position</span>
                  <div className="kiosk-ticket-value">
                    {lastTicket.position}
                  </div>
                </div>
                <div>
                  <span className="kiosk-ticket-label">Time</span>
                  <div className="kiosk-ticket-value">
                    {new Date(lastTicket.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="kiosk-panel">
          <div className="kiosk-panel-title">Available branches</div>
          <div className="kiosk-choice-grid">
            {branches.map((branch) => (
              <button
                key={branch.id}
                className="kiosk-choice"
                onClick={() => onSelectBranch(branch)}
              >
                <div>
                  <div className="kiosk-choice-title">{branch.name}</div>
                  {branch.address && (
                    <div className="kiosk-choice-meta">{branch.address}</div>
                  )}
                </div>
                <span className="kiosk-choice-action">Select</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// Departments View Component
interface DepartmentsViewProps {
  branch: Branch;
  departments: Department[];
  onSelectDepartment: (department: Department) => void;
  onBack: () => void;
}

const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  branch,
  departments,
  onSelectDepartment,
  onBack,
}) => {
  return (
    <div className="kiosk-view">
      <div className="kiosk-stepbar">
        <button onClick={onBack} className="kiosk-back-button">
          Back
        </button>
        <div>
          <p className="kiosk-step-label">Step 2 of 3</p>
          <h2 className="kiosk-title">{branch.name}</h2>
          <p className="kiosk-subtitle">Select a department to continue.</p>
        </div>
        <div className="kiosk-step-hint">
          <Users className="w-4 h-4 text-teal-700" />
          <span>{departments.length} departments</span>
        </div>
      </div>

      <div className="kiosk-grid">
        <section className="kiosk-panel">
          <div className="kiosk-panel-title">Branch overview</div>
          <div className="kiosk-info-card">
            <div className="kiosk-info-title">{branch.name}</div>
            <div className="kiosk-info-subtitle">
              Choose a department below for the service you need.
            </div>
          </div>
          <div className="kiosk-helper">
            Need assistance? Please ask the front desk.
          </div>
        </section>

        <section className="kiosk-panel">
          <div className="kiosk-panel-title">Available departments</div>
          <div className="kiosk-choice-grid">
            {departments.map((department) => (
              <button
                key={department.id}
                className="kiosk-choice"
                onClick={() => onSelectDepartment(department)}
              >
                <div className="kiosk-choice-title">{department.name}</div>
                <span className="kiosk-choice-action">Select</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// Services View Component
interface ServicesViewProps {
  department: Department;
  services: Service[];
  onSelectService: (service: Service) => void;
  onBack: () => void;
}

const ServicesView: React.FC<ServicesViewProps> = ({
  department,
  services,
  onSelectService,
  onBack,
}) => {
  const totalWaiting = services.reduce(
    (sum, service) => sum + service.current_queue_length,
    0,
  );

  return (
    <div className="kiosk-view">
      <div className="kiosk-stepbar">
        <button onClick={onBack} className="kiosk-back-button">
          Back
        </button>
        <div>
          <p className="kiosk-step-label">Step 3 of 3</p>
          <h2 className="kiosk-title">{department.name}</h2>
          <p className="kiosk-subtitle">Choose the service you need.</p>
        </div>
        <div className="kiosk-step-hint">
          <Clock className="w-4 h-4 text-teal-700" />
          <span>Live queue status</span>
        </div>
      </div>

      <div className="kiosk-grid">
        <section className="kiosk-panel">
          <div className="kiosk-panel-title">Queue insights</div>
          <div className="kiosk-metrics">
            <div>
              <p className="kiosk-metric-label">Total waiting</p>
              <p className="kiosk-metric-value">{totalWaiting}</p>
            </div>
            <div>
              <p className="kiosk-metric-label">Services available</p>
              <p className="kiosk-metric-value">{services.length}</p>
            </div>
          </div>
          <div className="kiosk-helper">
            Select a service to print a ticket and receive updates.
          </div>
        </section>

        <section className="kiosk-panel">
          <div className="kiosk-panel-title">Available services</div>
          <div className="kiosk-choice-grid">
            {services.map((service) => (
              <button
                key={service.id}
                className="kiosk-choice"
                onClick={() => onSelectService(service)}
              >
                <div>
                  <div className="kiosk-choice-title">{service.name}</div>
                  {service.description && (
                    <div className="kiosk-choice-meta">
                      {service.description}
                    </div>
                  )}
                </div>
                <div className="kiosk-choice-stats">
                  <span className="kiosk-chip">
                    <Users className="w-4 h-4" />
                    {service.current_queue_length} waiting
                  </span>
                  <span className="kiosk-chip kiosk-chip-ghost">
                    <Clock className="w-4 h-4" />
                    {service.estimated_wait_time}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// Print Ticket Modal
interface PrintTicketModalProps {
  service: Service;
  customerPhone: string;
  phoneError: string;
  onChangePhone: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  service,
  customerPhone,
  phoneError,
  onChangePhone,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="kiosk-modal-backdrop">
      <div className="kiosk-modal">
        <div className="kiosk-modal-header">
          <h3 className="kiosk-modal-title">Confirm your ticket</h3>
          <p className="kiosk-modal-subtitle">Service: {service.name}</p>
        </div>

        <div className="kiosk-modal-body">
          <label className="kiosk-label">Mobile number</label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => onChangePhone(e.target.value)}
            placeholder="+1234567890"
            className={`kiosk-input ${phoneError ? "kiosk-input-error" : ""}`}
          />
          {phoneError ? (
            <p className="kiosk-error">{phoneError}</p>
          ) : (
            <p className="kiosk-hint">Used to send ticket updates.</p>
          )}
        </div>

        <div className="kiosk-modal-actions">
          <button onClick={onCancel} className="kiosk-secondary-button">
            Cancel
          </button>
          <button onClick={onConfirm} className="kiosk-primary-button">
            <Ticket className="w-5 h-5" />
            Print ticket
          </button>
        </div>
      </div>
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
    <div className="kiosk-view">
      <div className="kiosk-stepbar">
        <button onClick={onBack} className="kiosk-back-button">
          Back
        </button>
        <div>
          <p className="kiosk-step-label">Optional path</p>
          <h2 className="kiosk-title">Join via WhatsApp</h2>
          <p className="kiosk-subtitle">
            Scan the code to receive updates on your phone.
          </p>
        </div>
      </div>

      <div className="kiosk-grid kiosk-qr-grid">
        <section className="kiosk-panel">
          <div className="kiosk-panel-title">How it works</div>
          <ol className="kiosk-steps">
            <li>Scan the QR code with your phone camera.</li>
            <li>Send the WhatsApp message to start.</li>
            <li>Choose your service and receive a ticket.</li>
            <li>Get real-time updates from the clinic.</li>
          </ol>
          <div className="kiosk-info-card">
            <Phone className="w-4 h-4 text-teal-700" />
            <span>WhatsApp: {organization.whatsapp_business_number}</span>
          </div>
        </section>

        <section className="kiosk-panel kiosk-qr-panel">
          <div className="kiosk-panel-title">Scan to join</div>
          <div className="kiosk-qr-frame">
            {loading ? (
              <div className="kiosk-qr-loading">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : qrCode ? (
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="kiosk-qr-image"
              />
            ) : (
              <div className="kiosk-qr-error">
                <p>Unable to generate QR code.</p>
              </div>
            )}
          </div>
        </section>
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
    <div className="kiosk-view">
      <div className="kiosk-stepbar">
        <button onClick={onBack} className="kiosk-back-button">
          Back
        </button>
        <div>
          <p className="kiosk-step-label">Administration</p>
          <h2 className="kiosk-title">Kiosk settings</h2>
          <p className="kiosk-subtitle">Device diagnostics and details.</p>
        </div>
      </div>

      <div className="kiosk-grid">
        <section className="kiosk-panel">
          <div className="kiosk-panel-title">Organization</div>
          <div className="kiosk-info-list">
            <div>
              <span className="kiosk-info-label">Name</span>
              <span className="kiosk-info-value">{organization.name}</span>
            </div>
            <div>
              <span className="kiosk-info-label">ID</span>
              <span className="kiosk-info-value">{organization.id}</span>
            </div>
            <div>
              <span className="kiosk-info-label">WhatsApp</span>
              <span className="kiosk-info-value">
                {organization.whatsapp_business_number}
              </span>
            </div>
          </div>
        </section>

        <section className="kiosk-panel">
          <div className="kiosk-panel-title">Printer status</div>
          <div className="kiosk-status-row">
            <div className="kiosk-status-pill">
              <Printer
                className={`w-5 h-5 ${
                  isPrinterReady ? "text-emerald-600" : "text-rose-500"
                }`}
              />
              <span>
                {isPrinterReady ? "Ready to print" : "Not connected"}
              </span>
            </div>
            <button onClick={onCheckPrinter} className="kiosk-primary-button">
              Check printer
            </button>
          </div>

          <div className="kiosk-panel-title">System info</div>
          <div className="kiosk-info-list">
            <div>
              <span className="kiosk-info-label">Version</span>
              <span className="kiosk-info-value">2.0.0</span>
            </div>
            <div>
              <span className="kiosk-info-label">Mode</span>
              <span className="kiosk-info-value">Kiosk</span>
            </div>
            <div>
              <span className="kiosk-info-label">Last updated</span>
              <span className="kiosk-info-value">
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default KioskApp;
