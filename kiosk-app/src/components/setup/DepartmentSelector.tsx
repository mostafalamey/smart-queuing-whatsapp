import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Layers, Loader2, ArrowLeft, ChevronRight, Users } from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface DepartmentSelectorProps {
  branchId: string;
  branchName: string;
  organizationName: string;
  onSelect: (department: Department) => void;
  onBack: () => void;
}

/**
 * Department selector for kiosk setup wizard
 * Displays all departments for the selected branch
 */
export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  branchId,
  branchName,
  organizationName,
  onSelect,
  onBack,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from("departments")
          .select("id, name, description")
          .eq("branch_id", branchId)
          .order("name");

        if (queryError) {
          throw new Error(queryError.message);
        }

        setDepartments(data || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load departments";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, [branchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading departments...</p>
        </div>
      </div>
    );
  }

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
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Select Department
              </h1>
              <p className="text-slate-600">
                {organizationName} • {branchName}
              </p>
            </div>
          </div>

          <div className="mt-4 h-1 bg-slate-200 rounded-full">
            <div
              className="h-1 bg-blue-600 rounded-full"
              style={{ width: "60%" }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">Step 3 of 4</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Department List */}
        {departments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              No departments found for this branch.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Please create departments in the admin dashboard first.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {departments.map((department) => (
              <button
                key={department.id}
                onClick={() => onSelect(department)}
                className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {department.name}
                  </h3>
                  {department.description && (
                    <p className="text-sm text-slate-500 truncate mt-1">
                      {department.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentSelector;
