import { Phone, Users, RotateCcw, ArrowRightLeft } from "lucide-react";
import { QueueData } from "../shared/types";
import { Button } from "@/components/ui/Button";

interface QueueStatusProps {
  queueData: QueueData | null;
  loading: boolean;
  onCallNext: () => void;
  onShowResetModal: () => void;
  onSkipTicket: () => void;
  onCompleteTicket: () => void;
  onTransferTicket?: () => void;
  canResetQueue?: boolean;
  canTransferTicket?: boolean;
  currentTicketHandled?: boolean;
  showInfo: (
    title: string,
    message: string,
    action?: { label: string; onClick: () => void },
  ) => void;
}

export const QueueStatus = ({
  queueData,
  loading,
  onCallNext,
  onShowResetModal,
  onSkipTicket,
  onCompleteTicket,
  onTransferTicket,
  canResetQueue = true,
  canTransferTicket = true,
  currentTicketHandled = false,
  showInfo,
}: QueueStatusProps) => {
  if (!queueData) return null;

  const isDisabled =
    !queueData.waitingCount ||
    loading ||
    (!!queueData.currentServing && !currentTicketHandled);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full border border-gray-300">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="font-semibold text-base text-gray-900">
              Queue Status
            </h3>
          </div>

          {/* Reset Queue - Secondary Action in Header */}
          {canResetQueue && (
            <Button
              onClick={onShowResetModal}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-error hover:bg-error-50"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col space-y-6">
          {/* Currently Serving Section */}
          <div
            className={`rounded-lg p-4 border transition-all duration-150 ${
              queueData.currentServing
                ? "bg-warning-50 border-warning-300"
                : "bg-gray-50 border-gray-300"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    queueData.currentServing ? "bg-warning-500" : "bg-gray-400"
                  }`}
                >
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-sm text-gray-900">
                  Currently Serving
                </h4>
              </div>

              {queueData.currentServing && (
                <span className="bg-error text-white px-2 py-1 rounded-full text-xs font-medium">
                  Action Required
                </span>
              )}
            </div>

            {/* Ticket Information */}
            <div className="mb-3">
              <p
                className={`font-semibold text-sm mb-1 ${
                  queueData.currentServing ? "text-gray-900" : "text-gray-700"
                }`}
              >
                {queueData.currentServing
                  ? `Ticket ${queueData.currentServing}`
                  : "No ticket currently being served"}
              </p>
              {queueData.service && (
                <p className="text-xs text-gray-700">
                  Service: {queueData.service.name} (
                  {queueData.service.estimated_time}min)
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {queueData.currentServing && (
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => {
                    showInfo(
                      "Skip Current Customer?",
                      `This will mark ticket ${queueData.currentServing} as cancelled and clear the current serving status. You can then call the next customer.`,
                      {
                        label: "Skip Customer",
                        onClick: () => onSkipTicket(),
                      },
                    );
                  }}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="border-warning-500 text-warning-700 hover:bg-warning-50"
                >
                  Skip
                </Button>

                {canTransferTicket && onTransferTicket && (
                  <Button
                    onClick={onTransferTicket}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                    className="border-info text-info hover:bg-info-100"
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-1" />
                    Transfer
                  </Button>
                )}

                <Button
                  onClick={() => {
                    showInfo(
                      "Complete Current Customer?",
                      `This will mark ticket ${queueData.currentServing} as completed and clear the current serving status. You can then call the next customer.`,
                      {
                        label: "Complete Service",
                        onClick: () => onCompleteTicket(),
                      },
                    );
                  }}
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  className="bg-success hover:bg-success-600"
                >
                  Complete
                </Button>
              </div>
            )}
          </div>

          {/* Waiting Count Display */}
          <div className="text-center py-8">
            <p className="text-gray-700 text-sm mb-2">Customers Waiting</p>
            <p className="text-6xl font-bold text-gray-900">
              {queueData.waitingCount || 0}
            </p>
          </div>

          {/* Actions */}
          <div>
            {/* Call Next Button - Primary Action */}
            <Button
              onClick={onCallNext}
              disabled={isDisabled}
              variant="primary"
              size="lg"
              loading={loading}
              fullWidth
              className="bg-success hover:bg-success-600 disabled:bg-gray-400 h-12"
            >
              <Phone className="w-5 h-5 mr-2" />
              {loading
                ? "Calling..."
                : !!queueData.currentServing && !currentTicketHandled
                  ? "Handle Current Ticket First"
                  : "Call Next Customer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
