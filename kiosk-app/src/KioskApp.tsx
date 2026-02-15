import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  Users,
  Clock,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Ticket,
  Phone,
  MessageSquare,
} from "lucide-react";
import QRCode from "qrcode";
import toast, { Toaster } from "react-hot-toast";
import usePrinter from "./hooks/usePrinter";
import type { TicketData } from "./types/electron";
import { supabase } from "./lib/supabase";

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

interface KioskAppProps {
  onReconfigure?: () => void;
}

const KioskApp: React.FC<KioskAppProps> = ({ onReconfigure }) => {
  // Printer hook for Electron integration
  const {
    printerStatus,
    printTicket: electronPrintTicket,
    isElectron,
    checkStatus,
    error: _printerError, // Available for error display if needed
  } = usePrinter();

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Get organization ID from URL params or environment variable
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get("org") || import.meta.env.VITE_ORGANIZATION_ID;
  const branchIdParam = urlParams.get("branch");
  const departmentIdParam = urlParams.get("department");

  // In Electron mode with department set, the kiosk is "locked" to that department
  const isLocked = !!departmentIdParam;

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

  // Update printer ready state from Electron hook
  useEffect(() => {
    if (isElectron && printerStatus) {
      setIsPrinterReady(printerStatus.connected);
    }
  }, [isElectron, printerStatus]);

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
      // In Electron mode, check printer status via IPC
      if (isElectron) {
        // Get list of system printers for debugging
        try {
          const printerList = await window.electronAPI!.printer.list();
          console.log('Available system printers:', printerList);
        } catch (err) {
          console.warn('Could not get printer list:', err);
        }
        
        // Check thermal printer status
        await checkStatus();
        
        // Wait a moment for state to update
        setTimeout(() => {
          if (printerStatus?.connected) {
            toast.success(`Printer connected: ${printerStatus.status}`, {
              duration: 3000,
              position: 'bottom-center',
            });
          } else {
            toast.error(
              printerStatus?.status || 'Printer not connected. Please check USB connection.',
              {
                duration: 4000,
                position: 'bottom-center',
              }
            );
          }
        }, 200);
        return;
      }

      // In browser mode, assume printer is ready (for development)
      setIsPrinterReady(true);
      toast.success('Running in browser mode (no physical printer)', {
        duration: 3000,
        position: 'bottom-center',
      });
    } catch (error) {
      console.error("Printer check failed:", error);
      setIsPrinterReady(false);
      toast.error('Failed to check printer status', {
        duration: 3000,
        position: 'bottom-center',
      });
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
      const { data: ticketData, error } = await supabase
        .rpc("create_ticket_for_service", {
          p_service_id: service.id,
          p_customer_phone: phone,
          p_created_via: "kiosk",
        })
        .single();

      if (error) throw error;

      // Type the RPC response
      const ticket = ticketData as {
        id: string;
        ticket_number: string;
        created_at: string;
        customer_phone?: string;
      };

      // Get queue position
      const { count } = await supabase
        .from("tickets")
        .select("*", { count: "exact" })
        .eq("service_id", service.id)
        .in("status", ["waiting", "called"])
        .lt("created_at", ticket.created_at);

      const position = (count || 0) + 1;
      const fullTicket: Ticket = {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        created_at: ticket.created_at,
        customer_phone: ticket.customer_phone,
        service_name: service.name,
        position,
      };

      // Print physical ticket
      if (isPrinterReady) {
        await printPhysicalTicket(fullTicket);
      }

      setLastTicket(fullTicket);

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
    console.log("Printing ticket:", ticket);

    // Use Electron printer if available
    if (isElectron && window.electronAPI) {
      const ticketData: TicketData = {
        ticket_number: ticket.ticket_number,
        service_name: ticket.service_name,
        position: ticket.position,
        estimated_wait: calculateWaitTime(ticket.position),
        created_at: ticket.created_at,
        organization_name: organization?.name || "Queue System",
        branch_name: selectedBranch?.name,
        department_name: selectedDepartment?.name,
        qr_code_url: organization?.whatsapp_business_number
          ? `https://wa.me/${organization.whatsapp_business_number.replace(/^\+/, "")}?text=${encodeURIComponent(`My ticket: ${ticket.ticket_number}`)}`
          : undefined,
        customer_phone: ticket.customer_phone,
      };

      const result = await electronPrintTicket(ticketData);

      if (!result.success) {
        console.error("Print failed:", result.error);
        // Show error but don't block - ticket was already created
        alert(
          `Print error: ${result.error}\n\nYour ticket number is: ${ticket.ticket_number}`,
        );
      }
      return;
    }

    // Fallback for browser mode (development)
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

    // In browser mode, show alert
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
      <Toaster />
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
            onClick={() => setShowSettingsModal(true)}
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
            isLocked={isLocked}
          />
        )}

        {currentView === "qr" && (
          <QRView
            organization={organization}
            onBack={() => setCurrentView("branches")}
            generateQR={generateWhatsAppQR}
          />
        )}
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          organization={organization}
          isPrinterReady={isPrinterReady}
          onClose={() => setShowSettingsModal(false)}
          onCheckPrinter={checkPrinterStatus}
          onReconfigure={onReconfigure}
          isElectron={isElectron}
        />
      )}

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
  isLocked?: boolean;
}

const ServicesView: React.FC<ServicesViewProps> = ({
  department,
  services,
  onSelectService,
  onBack,
  isLocked = false,
}) => {
  return (
    <div className="kiosk-view kiosk-view-locked">
      <div className="kiosk-stepbar kiosk-stepbar-centered">
        {!isLocked && (
          <button onClick={onBack} className="kiosk-back-button">
            Back
          </button>
        )}
        <div className={isLocked ? "text-center flex-1" : ""}>
          {!isLocked && <p className="kiosk-step-label">Step 3 of 3</p>}
          <h2 className="kiosk-title">{department.name}</h2>
          <p className="kiosk-subtitle">Choose the service you need.</p>
        </div>
        <div className="kiosk-step-hint">
          <Clock className="w-4 h-4 text-teal-700" />
          <span>Live queue status</span>
        </div>
      </div>

      <div className="kiosk-services-container">
        <section className="kiosk-panel kiosk-panel-full">
          <div className="kiosk-panel-title">Available services</div>
          <div className="kiosk-services-list">
            {services.map((service) => (
              <button
                key={service.id}
                className="kiosk-service-card"
                onClick={() => onSelectService(service)}
              >
                <div className="kiosk-service-info">
                  <div className="kiosk-service-name">{service.name}</div>
                  {service.description && (
                    <div className="kiosk-service-desc">
                      {service.description}
                    </div>
                  )}
                </div>
                <div className="kiosk-service-stats">
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the phone input when modal opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle dial pad button press
  const handleDialPadPress = (digit: string) => {
    onChangePhone(customerPhone + digit);
    inputRef.current?.focus();
  };

  // Handle backspace
  const handleBackspace = () => {
    onChangePhone(customerPhone.slice(0, -1));
    inputRef.current?.focus();
  };

  // Handle clear
  const handleClear = () => {
    onChangePhone("");
    inputRef.current?.focus();
  };

  return (
    <div className="kiosk-modal-backdrop">
      <div className="kiosk-modal kiosk-modal-dialpad">
        <div className="kiosk-modal-header">
          <h3 className="kiosk-modal-title">Confirm your ticket</h3>
          <p className="kiosk-modal-subtitle">Service: {service.name}</p>
        </div>

        <div className="kiosk-modal-body">
          <label className="kiosk-label">Mobile number</label>
          <input
            ref={inputRef}
            type="tel"
            value={customerPhone}
            onChange={(e) => onChangePhone(e.target.value)}
            placeholder="+1234567890"
            className={`kiosk-input kiosk-input-phone ${phoneError ? "kiosk-input-error" : ""}`}
            autoFocus
          />
          {phoneError ? (
            <p className="kiosk-error">{phoneError}</p>
          ) : (
            <p className="kiosk-hint">Enter your mobile number for updates</p>
          )}

          {/* On-screen Dial Pad */}
          <div className="kiosk-dialpad">
            <div className="kiosk-dialpad-row">
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("1")}>1</button>
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("2")}>2</button>
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("3")}>3</button>
            </div>
            <div className="kiosk-dialpad-row">
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("4")}>4</button>
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("5")}>5</button>
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("6")}>6</button>
            </div>
            <div className="kiosk-dialpad-row">
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("7")}>7</button>
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("8")}>8</button>
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("9")}>9</button>
            </div>
            <div className="kiosk-dialpad-row">
              <button className="kiosk-dialpad-btn kiosk-dialpad-special" onClick={() => handleDialPadPress("+")}>+</button>
              <button className="kiosk-dialpad-btn" onClick={() => handleDialPadPress("0")}>0</button>
              <button className="kiosk-dialpad-btn kiosk-dialpad-special" onClick={handleBackspace}>⌫</button>
            </div>
            <div className="kiosk-dialpad-row kiosk-dialpad-row-single">
              <button className="kiosk-dialpad-btn kiosk-dialpad-clear" onClick={handleClear}>Clear</button>
            </div>
          </div>
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

// Settings Modal Component
interface SettingsModalProps {
  organization: Organization;
  isPrinterReady: boolean;
  onClose: () => void;
  onCheckPrinter: () => void;
  onReconfigure?: () => void;
  isElectron?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  organization,
  isPrinterReady,
  onClose,
  onCheckPrinter,
  onReconfigure,
  isElectron,
}) => {
  return (
    <div className="kiosk-modal-backdrop" onClick={onClose}>
      <div
        className="kiosk-settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kiosk-settings-header">
          <h3 className="kiosk-settings-title">Kiosk Settings</h3>
          <button onClick={onClose} className="kiosk-close-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="kiosk-settings-body">
          <div className="kiosk-settings-section">
            <div className="kiosk-panel-title">Organization</div>
            <div className="kiosk-info-list">
              <div>
                <span className="kiosk-info-label">Name</span>
                <span className="kiosk-info-value">{organization.name}</span>
              </div>
              <div>
                <span className="kiosk-info-label">WhatsApp</span>
                <span className="kiosk-info-value">
                  {organization.whatsapp_business_number}
                </span>
              </div>
            </div>
          </div>

          <div className="kiosk-settings-section">
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
          </div>

          <div className="kiosk-settings-section">
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
          </div>

          {/* Reconfigure Kiosk Button - Only shown in Electron mode */}
          {isElectron && onReconfigure && (
            <div className="kiosk-settings-section">
              <div className="kiosk-panel-title">Administration</div>
              <button
                onClick={() => {
                  onClose();
                  onReconfigure();
                }}
                className="kiosk-reconfigure-button"
              >
                <Settings className="w-5 h-5" />
                Reconfigure Kiosk
              </button>
              <p className="kiosk-reconfigure-hint">
                Change department, PIN, or factory reset. Requires admin PIN.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KioskApp;
