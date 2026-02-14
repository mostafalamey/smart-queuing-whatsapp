"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import ResetQueueModal from "@/components/ResetQueueModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { MemberWelcomeFlow } from "@/app/organization/features/member-onboarding/MemberWelcomeFlow";
import ProfileDropdown from "@/components/ProfileDropdown";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

// Feature components
import { DashboardHeader } from "./features/dashboard-header";
import { QueueManager } from "./features/queue-management";
import { QueueStatus, TransferTicketModal } from "./features/queue-status";
import {
  useQueueOperations,
  useTransferTicket,
} from "./features/queue-controls";
import {
  useDashboardData,
  useRealtimeSubscriptions,
  ConnectionErrorBanner,
} from "./features/shared";

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [showResetQueueModal, setShowResetQueueModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [queueOperationLoading, setQueueOperationLoading] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);

  // Use custom hooks for data management
  const dashboardData = useDashboardData();
  const queueOperations = useQueueOperations();
  const transferTicket = useTransferTicket();

  // Onboarding functionality
  const {
    needsOnboarding,
    loading: onboardingLoading,
    markOnboardingComplete,
    skipOnboarding,
  } = useOnboarding(dashboardData.userProfile);

  // Real-time subscriptions
  useRealtimeSubscriptions(
    dashboardData.selectedDepartment,
    dashboardData.fetchQueueData,
    dashboardData.isFetchingRef,
  );

  // Redirect if not authenticated (using useEffect to avoid setState during render)
  useEffect(() => {
    if (!authLoading && !user && dashboardData.mounted) {
      router.replace("/login");
    }
  }, [authLoading, user, dashboardData.mounted, router]);

  // Show loading if auth is still loading or component not mounted
  if (authLoading || !dashboardData.mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 bg-white rounded animate-pulse"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  // Handle queue operations with proper parameters
  const handleCallNext = () => {
    queueOperations.callNext(
      dashboardData.selectedDepartment,
      dashboardData.selectedService,
      dashboardData.queueData,
      dashboardData.userProfile,
      dashboardData.organization,
      dashboardData.fetchQueueData,
      setQueueOperationLoading,
      (error) => {
        /* setConnectionError handled in dashboardData */
      },
      dashboardData.showSuccess,
      dashboardData.showInfo,
      dashboardData.showError,
    );
  };

  const handleSkipTicket = () => {
    queueOperations.skipCurrentTicket(
      dashboardData.selectedDepartment,
      dashboardData.queueData,
      dashboardData.fetchQueueData,
      setQueueOperationLoading,
      (error) => {
        /* setConnectionError handled in dashboardData */
      },
      dashboardData.showWarning,
      dashboardData.showError,
      dashboardData.showSuccess,
    );
    // Mark ticket as handled after skipping
    dashboardData.markCurrentTicketAsHandled();
  };

  const handleCompleteTicket = () => {
    queueOperations.completeCurrentTicket(
      dashboardData.selectedDepartment,
      dashboardData.queueData,
      dashboardData.fetchQueueData,
      setQueueOperationLoading,
      (error) => {
        /* setConnectionError handled in dashboardData */
      },
      dashboardData.showSuccess,
      dashboardData.showError,
    );
    // Mark ticket as handled after completing
    dashboardData.markCurrentTicketAsHandled();
  };

  const handleResetQueue = (includeCleanup: boolean) => {
    queueOperations.resetQueue(
      dashboardData.selectedDepartment,
      includeCleanup,
      dashboardData.fetchQueueData,
      setQueueOperationLoading,
      (error) => {
        /* setConnectionError handled in dashboardData */
      },
      dashboardData.showWarning,
      dashboardData.showError,
    );
  };

  // Handle opening transfer modal
  const handleOpenTransferModal = async () => {
    // Get the current serving ticket ID
    if (
      !dashboardData.queueData?.currentServing ||
      !dashboardData.userProfile?.organization_id
    ) {
      return;
    }

    // Fetch the ticket ID from the database (we have ticket_number, need ticket_id)
    const { data: ticketData } = await (await import("@/lib/supabase")).supabase
      .from("tickets")
      .select("id")
      .eq("department_id", dashboardData.selectedDepartment)
      .eq("status", "serving")
      .limit(1)
      .single();

    if (ticketData) {
      setCurrentTicketId(ticketData.id);
      // Fetch available destinations
      await transferTicket.fetchTransferDestinations(
        dashboardData.userProfile.organization_id,
        dashboardData.selectedService || "",
      );
      setShowTransferModal(true);
    }
  };

  // Handle transfer confirmation
  const handleTransfer = async (
    destinationServiceId: string,
    reason?: string,
    notes?: string,
  ) => {
    if (!currentTicketId || !dashboardData.userProfile?.organization_id) return;

    const result = await transferTicket.transferTicket(
      {
        ticketId: currentTicketId,
        toServiceId: destinationServiceId,
        transferReason: reason,
        transferNotes: notes,
      },
      {
        organizationId: dashboardData.userProfile.organization_id,
        organizationName: dashboardData.organization?.name || "Organization",
        currentServiceName: dashboardData.queueData?.service?.name || "Service",
        currentDepartmentName:
          dashboardData.queueData?.department?.name || "Department",
      },
      dashboardData.fetchQueueData,
      dashboardData.showSuccess,
      dashboardData.showError,
    );

    if (result?.success) {
      setShowTransferModal(false);
      setCurrentTicketId(null);
      dashboardData.markCurrentTicketAsHandled();
    }
  };

  const isEmployee = dashboardData.userRole === "employee";
  const handleEditProfile = () => {
    router.push("/profile");
  };

  return (
    <div className="p-6 space-y-6" suppressHydrationWarning={true}>
      {isEmployee && (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {dashboardData.organization?.logo_url ? (
                <img
                  src={dashboardData.organization.logo_url}
                  alt="Organization logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-700 font-semibold text-base">
                  {dashboardData.organization?.name?.charAt(0) || "O"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Organization
              </p>
              <p className="text-lg font-semibold text-gray-900 truncate">
                {dashboardData.organization?.name || "Organization"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={dashboardData.handleRefresh}
              disabled={dashboardData.loading}
              variant="outline"
              size="md"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  dashboardData.loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
            <div className="w-[170px]">
              <ProfileDropdown
                userProfile={dashboardData.userProfile}
                onEditProfile={handleEditProfile}
                onSignOut={signOut}
                variant="titlebar"
              />
            </div>
          </div>
        </div>
      )}

      {!isEmployee && (
        <DashboardHeader
          lastCleanupTime={dashboardData.lastCleanupTime}
          loading={dashboardData.loading}
          selectedDepartment={dashboardData.selectedDepartment}
          onRefresh={dashboardData.handleRefresh}
        />
      )}

      {/* Connection Error Banner */}
      <ConnectionErrorBanner
        connectionError={dashboardData.connectionError}
        onRefresh={dashboardData.handleRefresh}
      />

      {/* Phase 1 Complete! Analytics Test Panel can now be removed */}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Enhanced Queue Manager */}
        <div className="xl:col-span-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main Queue Manager Card */}
            <div className="lg:col-span-2">
              <QueueManager
                selectedBranch={dashboardData.selectedBranch}
                setSelectedBranch={dashboardData.setSelectedBranch}
                selectedDepartment={dashboardData.selectedDepartment}
                setSelectedDepartment={dashboardData.setSelectedDepartment}
                selectedService={dashboardData.selectedService}
                setSelectedService={dashboardData.setSelectedService}
                branches={dashboardData.branches}
                departments={dashboardData.departments}
                services={dashboardData.services}
                canSelectBranch={dashboardData.canSelectBranch}
                canSelectDepartment={dashboardData.canSelectDepartment}
                currentUserRole={dashboardData.userRole}
                assignedDepartmentName={dashboardData.getAssignedDepartmentName()}
              />
            </div>

            {/* Queue Status and Actions - Side Panel */}
            <div className="lg:col-span-3">
              <QueueStatus
                queueData={dashboardData.queueData}
                loading={queueOperationLoading}
                onCallNext={handleCallNext}
                onShowResetModal={() => setShowResetQueueModal(true)}
                onSkipTicket={handleSkipTicket}
                onCompleteTicket={handleCompleteTicket}
                onTransferTicket={handleOpenTransferModal}
                canResetQueue={dashboardData.canResetQueue}
                canTransferTicket={dashboardData.canTransferTicket}
                currentTicketHandled={dashboardData.currentTicketHandled}
                showInfo={dashboardData.showInfo}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reset Queue Modal */}
      <ResetQueueModal
        isOpen={showResetQueueModal}
        onClose={() => setShowResetQueueModal(false)}
        onResetOnly={() => handleResetQueue(false)}
        onResetWithCleanup={() => handleResetQueue(true)}
        queueName={
          dashboardData.queueData?.service
            ? `${dashboardData.queueData.service.name} (${dashboardData.queueData.department?.name})`
            : dashboardData.queueData?.department?.name || "queue"
        }
      />

      {/* Transfer Ticket Modal */}
      <TransferTicketModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setCurrentTicketId(null);
        }}
        ticketNumber={dashboardData.queueData?.currentServing || ""}
        currentServiceName={dashboardData.queueData?.service?.name}
        destinations={transferTicket.destinations}
        isLoadingDestinations={transferTicket.isLoadingDestinations}
        isTransferring={transferTicket.isLoading}
        onTransfer={handleTransfer}
      />

      {/* Member Onboarding Flow */}
      {needsOnboarding && !onboardingLoading && dashboardData.userProfile && (
        <MemberWelcomeFlow
          userProfile={dashboardData.userProfile}
          organization={dashboardData.organization}
          onComplete={markOnboardingComplete}
          onSkip={skipOnboarding}
        />
      )}
    </div>
  );
}

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";
