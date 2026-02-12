import { RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DashboardHeaderProps {
  lastCleanupTime: Date | null;
  loading: boolean;
  selectedDepartment: string;
  onRefresh: () => void;
}

export const DashboardHeader = ({
  lastCleanupTime,
  loading,
  selectedDepartment,
  onRefresh,
}: DashboardHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {/* Header Content */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Queue Dashboard
          </h1>
          <p className="text-sm text-gray-700">
            Monitor and manage active queues across all departments
          </p>
          {lastCleanupTime && (
            <p className="text-xs text-gray-500 mt-1">
              Last auto-cleanup: {lastCleanupTime.toLocaleString()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="md"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {/* Status Badge */}
          <div className="flex items-center space-x-2 px-4 py-2 bg-success-50 border border-success-200 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-success-600" />
            <span className="text-sm font-medium text-success-700">
              Auto-Cleanup Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
