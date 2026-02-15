import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Loader2,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Branch {
  id: string;
  name: string;
  address?: string;
}

interface BranchSelectorProps {
  organizationId: string;
  organizationName: string;
  onSelect: (branch: Branch) => void;
  onBack: () => void;
}

/**
 * Branch selector for kiosk setup wizard
 * Displays all branches for the admin's organization
 */
export const BranchSelector: React.FC<BranchSelectorProps> = ({
  organizationId,
  organizationName,
  onSelect,
  onBack,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from("branches")
          .select("id, name, address")
          .eq("organization_id", organizationId)
          .order("name");

        if (queryError) {
          throw new Error(queryError.message);
        }

        setBranches(data || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load branches";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading branches...</p>
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
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Select Branch
              </h1>
              <p className="text-slate-600">{organizationName}</p>
            </div>
          </div>

          <div className="mt-4 h-1 bg-slate-200 rounded-full">
            <div
              className="h-1 bg-blue-600 rounded-full"
              style={{ width: "40%" }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">Step 2 of 4</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Branch List */}
        {branches.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              No branches found for this organization.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Please create branches in the admin dashboard first.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => onSelect(branch)}
                className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {branch.name}
                  </h3>
                  {branch.address && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{branch.address}</span>
                    </div>
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

export default BranchSelector;
