import {
  ZoomIn,
  ZoomOut,
  Home,
  Plus,
  Save,
  Lock,
  Crown,
  LayoutGrid,
  Maximize,
  GitBranch,
} from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useAppToast } from "@/hooks/useAppToast";

interface TreeControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onZoomExtents?: () => void;
  onCreateBranch: () => void;
  onSaveLayout?: () => void;
  onAutoRearrange?: () => void;
  moveChildrenWithParent?: boolean;
  onToggleMoveChildren?: () => void;
  canCreateBranch?: boolean; // Made optional for backward compatibility
}

export const TreeControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onZoomExtents,
  onCreateBranch,
  onSaveLayout,
  onAutoRearrange,
  moveChildrenWithParent,
  onToggleMoveChildren,
  canCreateBranch,
}: TreeControlsProps) => {
  const { planLimits, checkLimits, getLimitMessage } = usePlanLimits();
  const { showError } = useAppToast();

  // Both role permissions AND plan limits must be satisfied
  const limits = checkLimits();
  const hasRolePermission =
    canCreateBranch !== undefined ? canCreateBranch : true;
  const hasPlanAllowance = limits.canCreateBranch;
  const canActuallyCreateBranch = hasRolePermission && hasPlanAllowance;

  const limitMessage = getLimitMessage("branch");
  const isDisabled = !canActuallyCreateBranch;

  // Show upgrade hint for premium features
  const isPremiumPlan =
    planLimits?.plan === "business" || planLimits?.plan === "enterprise";

  const handleCreateBranch = () => {
    if (isDisabled) {
      if (!hasRolePermission) {
        showError("You do not have permission to create branches");
      } else if (!hasPlanAllowance) {
        showError(
          limitMessage || "Cannot create more branches with your current plan"
        );
      } else {
        showError("Cannot create branch");
      }
      return;
    }
    onCreateBranch();
  };
  return (
    <>
      {/* Horizontal Toolbar at Top Right */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
        {/* Icon-only toolbar buttons in horizontal layout */}
        <div className="bg-gray-700 rounded-lg p-2">
          <div className="flex gap-1">
            <button
              onClick={onZoomIn}
              disabled={zoom >= 3}
              className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              title="Zoom In - Increase canvas zoom level"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={onZoomOut}
              disabled={zoom <= 0.3}
              className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              title="Zoom Out - Decrease canvas zoom level"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={onResetView}
              className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors duration-150 text-white"
              title="Reset View - Return to center and default zoom"
              aria-label="Reset view to center"
            >
              <Home className="w-4 h-4" />
            </button>
            {onZoomExtents && (
              <button
                onClick={onZoomExtents}
                className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors duration-150 text-white"
                title="Zoom to Fit All - Fit all nodes in viewport"
                aria-label="Zoom to fit all nodes in view"
              >
                <Maximize className="w-4 h-4" />
              </button>
            )}
            {onSaveLayout && (
              <button
                onClick={onSaveLayout}
                className="p-2 rounded-lg bg-success-600 hover:bg-success-700 transition-colors duration-150 text-white"
                title="Save Layout - Save current node positions"
                aria-label="Save current node positions and viewport"
              >
                <Save className="w-4 h-4" />
              </button>
            )}
            {onAutoRearrange && (
              <button
                onClick={onAutoRearrange}
                className="p-2 rounded-lg bg-info-600 hover:bg-info-700 transition-colors duration-150 text-white"
                title="Auto Arrange - Organize nodes in hierarchical layout"
                aria-label="Automatically arrange nodes in hierarchical layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            )}
            {onToggleMoveChildren && (
              <button
                onClick={onToggleMoveChildren}
                className={`p-2 rounded-lg transition-colors duration-150 text-white ${
                  moveChildrenWithParent
                    ? "bg-warning-600 hover:bg-warning-700"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                title={
                  moveChildrenWithParent
                    ? "Move Children: ON - Children move with parent"
                    : "Move Children: OFF - Children stay in place when parent moves"
                }
                aria-label={`Toggle move children with parent: ${
                  moveChildrenWithParent ? "enabled" : "disabled"
                }`}
              >
                <GitBranch
                  className={`w-4 h-4 ${
                    moveChildrenWithParent ? "text-warning-200" : "text-gray-400"
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Add Branch button - larger and separate */}
        <button
          onClick={handleCreateBranch}
          disabled={isDisabled}
          title={
            isDisabled
              ? !hasRolePermission
                ? "You do not have permission to create branches"
                : limitMessage || "Upgrade to create more branches"
              : "Add Branch - Create a new branch in your organization"
          }
          className={`flex items-center gap-2 p-3 rounded-lg transition-colors duration-150 shadow-lg ${
            isDisabled
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-primary-600 hover:bg-primary-700 text-white"
          }`}
          aria-label={
            isDisabled
              ? !hasRolePermission
                ? "Access denied - cannot create branches"
                : limitMessage || "Plan limit reached"
              : "Create new branch"
          }
        >
          {isDisabled ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">Add Branch</span>
          {!isPremiumPlan && <Crown className="w-3 h-3 text-yellow-400" />}
        </button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-gray-700 rounded-lg px-3 py-2">
          <span className="text-sm text-white">{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </>
  );
};
