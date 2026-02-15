import React, { useState, useRef, useEffect } from "react";
import { KeyRound, AlertCircle, Loader2, Lock } from "lucide-react";

interface PinEntryProps {
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * PIN Entry component for kiosk reconfiguration access
 * Includes lockout after 3 failed attempts
 */
export const PinEntry: React.FC<PinEntryProps> = ({
  onSuccess,
  onCancel,
  title = "Enter Admin PIN",
  description = "Enter the admin PIN to access kiosk settings",
}) => {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    pinRefs.current[0]?.focus();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutUntil) return;

    const interval = setInterval(() => {
      const remaining = lockoutUntil - Date.now();
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutRemaining(0);
        setAttempts(0);
        setError(null);
        pinRefs.current[0]?.focus();
      } else {
        setLockoutRemaining(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handlePinChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const getPinValue = () => pin.join("");

  const handleVerifyClick = () => {
    const pinValue = getPinValue();
    if (pinValue.length >= 4) {
      handleVerify(pinValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace - move to previous input
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }

    // Enter - verify
    if (e.key === "Enter") {
      const pinValue = pin.join("");
      if (pinValue.length >= 4) {
        handleVerify(pinValue);
      }
    }

    // Escape - cancel
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleVerify = async (pinValue: string) => {
    if (!window.electronAPI) {
      setError("Not running in Electron");
      return;
    }

    if (lockoutUntil && Date.now() < lockoutUntil) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isValid = await window.electronAPI.pin.verify(pinValue);

      if (isValid) {
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin(["", "", "", "", "", ""]);
        pinRefs.current[0]?.focus();

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_DURATION;
          setLockoutUntil(lockoutTime);
          setLockoutRemaining(Math.ceil(LOCKOUT_DURATION / 1000));
          setError(
            `Too many failed attempts. Try again in ${Math.ceil(LOCKOUT_DURATION / 60000)} minutes.`,
          );
        } else {
          setError(
            `Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? "s" : ""} remaining.`,
          );
        }
      }
    } catch (err) {
      setError("Failed to verify PIN");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil;

  const formatLockoutTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isLocked ? "bg-red-100" : "bg-blue-100"}`}
          >
            {isLocked ? (
              <Lock className="w-8 h-8 text-red-600" />
            ) : (
              <KeyRound className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-600 text-sm mt-1">{description}</p>
        </div>

        {/* Lockout Message */}
        {isLocked && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-800 font-medium">Account Locked</p>
            <p className="text-red-600 text-2xl font-mono mt-2">
              {formatLockoutTime(lockoutRemaining)}
            </p>
          </div>
        )}

        {/* PIN Inputs */}
        {!isLocked && (
          <>
            <p className="text-center text-xs text-slate-500 mb-2">
              Enter 4-6 digit PIN
            </p>
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
                  className={`w-10 h-12 text-center text-xl font-bold border-2 rounded-lg outline-none transition-all
                    ${digit ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}
                    focus:border-blue-600 focus:ring-2 focus:ring-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyClick}
              disabled={loading || getPinValue().length < 4}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify PIN"
              )}
            </button>
          </>
        )}

        {/* Error */}
        {error && !isLocked && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PinEntry;
