import React, { useState, useRef, useEffect } from "react";
import {
  KeyRound,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface PinSetupProps {
  organizationName: string;
  branchName: string;
  departmentName: string;
  onComplete: (pin: string) => void;
  onBack: () => void;
  saving?: boolean;
}

/**
 * PIN setup component for kiosk setup wizard
 * Allows admin to set a 4-6 digit PIN for kiosk reconfiguration
 */
export const PinSetup: React.FC<PinSetupProps> = ({
  organizationName,
  branchName,
  departmentName,
  onComplete,
  onBack,
  saving = false,
}) => {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState<string | null>(null);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    pinRefs.current[0]?.focus();
  }, []);

  // Focus first confirm input when moving to confirm step
  useEffect(() => {
    if (step === "confirm") {
      confirmPinRefs.current[0]?.focus();
    }
  }, [step]);

  const handlePinChange = (
    index: number,
    value: string,
    isConfirm: boolean,
  ) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value;

    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      const refs = isConfirm ? confirmPinRefs : pinRefs;
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    isConfirm: boolean,
  ) => {
    const currentPin = isConfirm ? confirmPin : pin;
    const refs = isConfirm ? confirmPinRefs : pinRefs;

    // Backspace - move to previous input
    if (e.key === "Backspace" && !currentPin[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }

    // Enter - proceed if at least 4 digits entered
    if (e.key === "Enter") {
      const pinValue = currentPin.join("");
      if (pinValue.length >= 4) {
        if (isConfirm) {
          handleConfirm();
        } else {
          handleProceedToConfirm();
        }
      }
    }
  };

  const getPinValue = (pinArray: string[]): string => {
    return pinArray.join("").trim();
  };

  const handleProceedToConfirm = () => {
    const pinValue = getPinValue(pin);

    if (pinValue.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setStep("confirm");
  };

  const handleConfirm = () => {
    const pinValue = getPinValue(pin);
    const confirmPinValue = getPinValue(confirmPin);

    if (confirmPinValue.length < 4) {
      setError("Please enter your PIN again");
      return;
    }

    if (pinValue !== confirmPinValue) {
      setError("PINs do not match. Please try again.");
      setConfirmPin(["", "", "", "", "", ""]);
      confirmPinRefs.current[0]?.focus();
      return;
    }

    onComplete(pinValue);
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("enter");
      setConfirmPin(["", "", "", "", "", ""]);
      setError(null);
    } else {
      onBack();
    }
  };

  const renderPinInputs = (
    pinArray: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    isConfirm: boolean,
  ) => (
    <div className="flex gap-2 justify-center">
      {pinArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (refs.current[index] = el)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinChange(index, e.target.value, isConfirm)}
          onKeyDown={(e) => handleKeyDown(index, e, isConfirm)}
          disabled={saving}
          className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg outline-none transition-all
            ${digit ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}
            ${index >= 4 ? "opacity-60" : ""}
            focus:border-blue-600 focus:ring-2 focus:ring-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            disabled={saving}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {step === "enter" ? "Set Admin PIN" : "Confirm PIN"}
              </h1>
              <p className="text-slate-600">{departmentName}</p>
            </div>
          </div>

          <div className="mt-4 h-1 bg-slate-200 rounded-full">
            <div
              className="h-1 bg-blue-600 rounded-full"
              style={{ width: step === "enter" ? "80%" : "100%" }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">Step 4 of 4</p>
        </div>

        {/* Configuration Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-blue-800">
            This kiosk will be configured for:
          </p>
          <p className="text-blue-900 mt-1">
            {organizationName} • {branchName} • {departmentName}
          </p>
        </div>

        {/* PIN Entry */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-center text-slate-600 mb-6">
            {step === "enter"
              ? "Enter a 4-6 digit PIN for kiosk reconfiguration"
              : "Re-enter your PIN to confirm"}
          </p>

          {renderPinInputs(
            step === "enter" ? pin : confirmPin,
            step === "enter" ? pinRefs : confirmPinRefs,
            step === "confirm",
          )}

          <p className="text-center text-xs text-slate-500 mt-3">
            {step === "enter"
              ? "Minimum 4 digits, maximum 6 digits"
              : "Enter the same PIN again"}
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={step === "enter" ? handleProceedToConfirm : handleConfirm}
            disabled={
              saving ||
              (step === "enter"
                ? getPinValue(pin).length < 4
                : getPinValue(confirmPin).length < 4)
            }
            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving configuration...
              </>
            ) : step === "enter" ? (
              "Continue"
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Complete Setup
              </>
            )}
          </button>
        </div>

        {/* Security Note */}
        <p className="text-center text-sm text-slate-500 mt-6">
          This PIN will be required to reconfigure or reset this kiosk. Keep it
          secure and share only with authorized staff.
        </p>
      </div>
    </div>
  );
};

export default PinSetup;
