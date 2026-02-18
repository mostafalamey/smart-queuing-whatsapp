import React from "react";
import { Monitor, Layers, ArrowLeft, ChevronRight } from "lucide-react";
import type { KioskType } from "../../types/electron";

interface KioskTypeSelectorProps {
  organizationName: string;
  branchName: string;
  onSelect: (type: KioskType) => void;
  onBack: () => void;
}

/**
 * Kiosk type selector for setup wizard
 * Allows choosing between "main" kiosk (shows all departments) 
 * or "department" kiosk (dedicated to one department)
 */
export const KioskTypeSelector: React.FC<KioskTypeSelectorProps> = ({
  organizationName,
  branchName,
  onSelect,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Select Kiosk Type
              </h1>
              <p className="text-slate-600">
                {organizationName} • {branchName}
              </p>
            </div>
          </div>

          <div className="mt-4 h-1 bg-slate-200 rounded-full">
            <div
              className="h-1 bg-blue-600 rounded-full"
              style={{ width: "50%" }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">Step 3 of 5</p>
        </div>

        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            Choose how this kiosk will operate. This determines what customers
            see when they approach the kiosk.
          </p>
        </div>

        {/* Kiosk Type Options */}
        <div className="space-y-3">
          {/* Main Kiosk Option */}
          <button
            onClick={() => onSelect("main")}
            className="w-full bg-white rounded-xl shadow-sm p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors text-left border-2 border-transparent hover:border-blue-200"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Layers className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-lg">
                Main Kiosk
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Displays all departments in this branch. Customers first select
                a department, then choose a service. Ideal for central locations
                or lobbies.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Multi-department
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                  Central Location
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-2" />
          </button>

          {/* Department Kiosk Option */}
          <button
            onClick={() => onSelect("department")}
            className="w-full bg-white rounded-xl shadow-sm p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors text-left border-2 border-transparent hover:border-blue-200"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Monitor className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-lg">
                Department Kiosk
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Dedicated to a single department. Customers go directly to
                service selection. Ideal for placing kiosks within specific
                department areas.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                  Single department
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                  Department-specific
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default KioskTypeSelector;
