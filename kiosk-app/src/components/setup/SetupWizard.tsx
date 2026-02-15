import React, { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import AdminLogin from "./AdminLogin";
import BranchSelector from "./BranchSelector";
import DepartmentSelector from "./DepartmentSelector";
import PinSetup from "./PinSetup";
import type { KioskConfigInput } from "../../types/electron";

type WizardStep =
  | "login"
  | "branch"
  | "department"
  | "pin"
  | "complete"
  | "error";

interface UserInfo {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
}

interface Branch {
  id: string;
  name: string;
  address?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface SetupWizardProps {
  onComplete: () => void;
  saveConfig: (
    config: KioskConfigInput,
    pin: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Setup Wizard - orchestrates the first-run kiosk configuration flow
 * Steps: Login → Select Branch → Select Department → Set PIN → Complete
 */
export const SetupWizard: React.FC<SetupWizardProps> = ({
  onComplete,
  saveConfig,
}) => {
  const [step, setStep] = useState<WizardStep>("login");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = (userInfo: UserInfo) => {
    setUser(userInfo);
    setStep("branch");
  };

  const handleBranchSelect = (selectedBranch: Branch) => {
    setBranch(selectedBranch);
    setStep("department");
  };

  const handleDepartmentSelect = (selectedDepartment: Department) => {
    setDepartment(selectedDepartment);
    setStep("pin");
  };

  const handlePinComplete = async (pin: string) => {
    if (!user || !branch || !department) {
      setError("Missing configuration data");
      setStep("error");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const config: KioskConfigInput = {
        organization_id: user.organizationId,
        organization_name: user.organizationName,
        branch_id: branch.id,
        branch_name: branch.name,
        department_id: department.id,
        department_name: department.name,
        configured_by: user.email,
      };

      const result = await saveConfig(config, pin);

      if (result.success) {
        setStep("complete");
        // Wait a moment to show success, then complete
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || "Failed to save configuration");
        setStep("error");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save configuration";
      setError(errorMessage);
      setStep("error");
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setStep("pin");
  };

  const handleStartOver = () => {
    setUser(null);
    setBranch(null);
    setDepartment(null);
    setError(null);
    setStep("login");
  };

  // Render current step
  switch (step) {
    case "login":
      return <AdminLogin onLoginSuccess={handleLoginSuccess} />;

    case "branch":
      return (
        <BranchSelector
          organizationId={user!.organizationId}
          organizationName={user!.organizationName}
          onSelect={handleBranchSelect}
          onBack={handleStartOver}
        />
      );

    case "department":
      return (
        <DepartmentSelector
          branchId={branch!.id}
          branchName={branch!.name}
          organizationName={user!.organizationName}
          onSelect={handleDepartmentSelect}
          onBack={() => setStep("branch")}
        />
      );

    case "pin":
      return (
        <PinSetup
          organizationName={user!.organizationName}
          branchName={branch!.name}
          departmentName={department!.name}
          onComplete={handlePinComplete}
          onBack={() => setStep("department")}
          saving={saving}
        />
      );

    case "complete":
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Setup Complete!
            </h1>
            <p className="text-slate-600 mb-4">
              This kiosk has been configured for:
            </p>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <p className="font-semibold text-slate-900">
                {user?.organizationName}
              </p>
              <p className="text-slate-600">{branch?.name}</p>
              <p className="text-blue-600">{department?.name}</p>
            </div>
            <p className="text-sm text-slate-500">Starting kiosk mode...</p>
          </div>
        </div>
      );

    case "error":
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Setup Failed
            </h1>
            <p className="text-slate-600 mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleStartOver}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default SetupWizard;
