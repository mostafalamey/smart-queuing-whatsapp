import React, { useState } from "react";
import {
  Settings,
  Layers,
  KeyRound,
  RotateCcw,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import PinEntry from "./PinEntry";

type ModalView = "pin" | "menu" | "change-pin" | "confirm-reset" | "success";

interface ReconfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeDepartment: () => void;
  onFactoryReset: () => void;
  currentConfig: {
    organizationName: string;
    branchName: string;
    departmentName: string;
  } | null;
}

/**
 * Reconfigure Modal - Allows admin to change department, PIN, or factory reset
 * Requires PIN authentication before showing options
 */
export const ReconfigureModal: React.FC<ReconfigureModalProps> = ({
  isOpen,
  onClose,
  onChangeDepartment,
  onFactoryReset,
  currentConfig,
}) => {
  const [view, setView] = useState<ModalView>("pin");
  const [changePinStep, setChangePinStep] = useState<
    "current" | "new" | "confirm"
  >("current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinSuccess = () => {
    setView("menu");
  };

  const handleClose = () => {
    setView("pin");
    setChangePinStep("current");
    setCurrentPin("");
    setNewPin("");
    setError(null);
    onClose();
  };

  const handleChangeDepartment = () => {
    handleClose();
    onChangeDepartment();
  };

  const handleFactoryReset = async () => {
    if (!window.electronAPI) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.config.clear();

      if (result.success) {
        setView("success");
        setTimeout(() => {
          handleClose();
          onFactoryReset();
        }, 1500);
      } else {
        setError("Failed to reset kiosk");
      }
    } catch (err) {
      setError("Failed to reset kiosk");
    } finally {
      setLoading(false);
    }
  };

  const handlePinUpdate = async (newPinValue: string) => {
    if (!window.electronAPI) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.pin.update(
        currentPin,
        newPinValue,
      );

      if (result.success) {
        setView("success");
        setTimeout(() => {
          setView("menu");
          setChangePinStep("current");
          setCurrentPin("");
          setNewPin("");
        }, 1500);
      } else {
        setError(result.error || "Failed to update PIN");
        setChangePinStep("current");
        setCurrentPin("");
        setNewPin("");
      }
    } catch (err) {
      setError("Failed to update PIN");
    } finally {
      setLoading(false);
    }
  };

  // PIN Entry View
  if (view === "pin") {
    return (
      <PinEntry
        onSuccess={handlePinSuccess}
        onCancel={handleClose}
        title="Admin Access"
        description="Enter PIN to access kiosk settings"
      />
    );
  }

  // Success View
  if (view === "success") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Success!</h2>
        </div>
      </div>
    );
  }

  // Main Modal Container
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Kiosk Settings</h2>
              {currentConfig && (
                <p className="text-sm text-slate-500">
                  {currentConfig.departmentName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Menu View */}
          {view === "menu" && (
            <div className="space-y-2">
              {/* Change Department */}
              <button
                onClick={handleChangeDepartment}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    Change Department
                  </p>
                  <p className="text-sm text-slate-500">
                    Assign kiosk to different department
                  </p>
                </div>
              </button>

              {/* Change PIN */}
              <button
                onClick={() => setView("change-pin")}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Change Admin PIN</p>
                  <p className="text-sm text-slate-500">
                    Update the kiosk access PIN
                  </p>
                </div>
              </button>

              {/* Factory Reset */}
              <button
                onClick={() => setView("confirm-reset")}
                className="w-full flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900">Factory Reset</p>
                  <p className="text-sm text-red-600">
                    Clear all settings and reconfigure
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Change PIN View */}
          {view === "change-pin" && (
            <ChangePinView
              step={changePinStep}
              onCurrentPinVerified={(pin) => {
                setCurrentPin(pin);
                setChangePinStep("new");
              }}
              onNewPinEntered={(pin) => {
                setNewPin(pin);
                setChangePinStep("confirm");
              }}
              onConfirmed={(pin) => {
                if (pin === newPin) {
                  handlePinUpdate(pin);
                } else {
                  setError("PINs do not match");
                  setChangePinStep("new");
                  setNewPin("");
                }
              }}
              onBack={() => {
                if (changePinStep === "new") {
                  setChangePinStep("current");
                  setCurrentPin("");
                } else if (changePinStep === "confirm") {
                  setChangePinStep("new");
                  setNewPin("");
                } else {
                  setView("menu");
                }
              }}
              loading={loading}
            />
          )}

          {/* Confirm Reset View */}
          {view === "confirm-reset" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Factory Reset?
              </h3>
              <p className="text-slate-600 mb-6">
                This will clear all kiosk settings. You will need to set up the
                kiosk again with admin credentials.
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleFactoryReset}
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Yes, Reset Kiosk"
                  )}
                </button>
                <button
                  onClick={() => setView("menu")}
                  disabled={loading}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for Change PIN flow
interface ChangePinViewProps {
  step: "current" | "new" | "confirm";
  onCurrentPinVerified: (pin: string) => void;
  onNewPinEntered: (pin: string) => void;
  onConfirmed: (pin: string) => void;
  onBack: () => void;
  loading: boolean;
}

const ChangePinView: React.FC<ChangePinViewProps> = ({
  step,
  onCurrentPinVerified,
  onNewPinEntered,
  onConfirmed,
  onBack,
  loading,
}) => {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const pinRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    setPin(["", "", "", "", "", ""]);
    setError(null);
    pinRefs.current[0]?.focus();
  }, [step]);

  const handlePinChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }

    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const pinValue = pin.join("");

    if (pinValue.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    if (step === "current") {
      // Verify current PIN
      if (!window.electronAPI) return;
      const isValid = await window.electronAPI.pin.verify(pinValue);
      if (isValid) {
        onCurrentPinVerified(pinValue);
      } else {
        setError("Incorrect PIN");
        setPin(["", "", "", "", "", ""]);
        pinRefs.current[0]?.focus();
      }
    } else if (step === "new") {
      onNewPinEntered(pinValue);
    } else {
      onConfirmed(pinValue);
    }
  };

  const getTitle = () => {
    switch (step) {
      case "current":
        return "Enter Current PIN";
      case "new":
        return "Enter New PIN";
      case "confirm":
        return "Confirm New PIN";
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 text-center mb-4">
        {getTitle()}
      </h3>

      <div className="flex gap-2 justify-center mb-4">
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (pinRefs.current[index] = el)}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handlePinChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={loading}
            className={`w-11 h-13 text-center text-xl font-bold border-2 rounded-lg outline-none transition-all
              ${digit ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}
              ${index >= 4 ? "opacity-60" : ""}
              focus:border-blue-600 focus:ring-2 focus:ring-blue-100
              disabled:opacity-50`}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={handleSubmit}
          disabled={loading || pin.join("").length < 4}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
        <button
          onClick={onBack}
          disabled={loading}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ReconfigureModal;
