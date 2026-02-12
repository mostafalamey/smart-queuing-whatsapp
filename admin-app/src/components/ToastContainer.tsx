"use client";

import React, { useEffect, useState } from "react";
import { useToast, Toast as ToastType } from "@/contexts/ToastContext";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 space-y-4 max-w-md w-full px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300); // Wait for exit animation
  };

  const getToastStyles = () => {
    const baseStyles =
      "relative overflow-hidden border shadow-lg";

    switch (toast.type) {
      case "success":
        return `${baseStyles} bg-success-50 border-success-200 text-success-900`;
      case "error":
        return `${baseStyles} bg-error-50 border-error-200 text-error-900`;
      case "warning":
        return `${baseStyles} bg-warning-50 border-warning-200 text-warning-900`;
      case "info":
        return `${baseStyles} bg-info-50 border-info-200 text-info-900`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-900`;
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";

    switch (toast.type) {
      case "success":
        return <CheckCircle className={`${iconClass} text-emerald-600`} />;
      case "error":
        return <AlertCircle className={`${iconClass} text-red-600`} />;
      case "warning":
        return <AlertTriangle className={`${iconClass} text-amber-600`} />;
      case "info":
        return <Info className={`${iconClass} text-blue-600`} />;
      default:
        return <Info className={`${iconClass} text-gray-600`} />;
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-emerald-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        rounded-xl p-4 transition-all duration-200 ease-out transform
        ${
          isVisible && !isExiting
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-full opacity-0 scale-95"
        }
      `}
    >
      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm leading-tight">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-sm opacity-80 mt-1 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleRemove}
              title="Close notification"
              aria-label="Close notification"
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors duration-200 group"
            >
              <X className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Action Button */}
          {toast.action && (
            <div className="mt-3 flex gap-2">
              {/* Main Action Button */}
              <button
                onClick={() => {
                  toast.action!.onClick();
                  handleRemove();
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  toast.action.label === "Delete" ||
                  toast.action.label === "Confirm"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-black/10 hover:bg-black/20"
                }`}
              >
                {toast.action.label}
              </button>

              {/* Cancel button for persistent toasts */}
              {toast.duration === 0 && (
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-xl overflow-hidden">
          <div
            className={`h-full ${getProgressBarColor()} toast-progress`}
            data-duration={toast.duration}
          />
        </div>
      )}
    </div>
  );
};

export default ToastContainer;
