"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  X,
  Search,
  Clock,
  Users,
  ChevronRight,
} from "lucide-react";
import Portal from "@/components/Portal";
import { Button } from "@/components/ui/Button";
import { TransferDestination } from "../queue-controls";

interface TransferTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  currentServiceName?: string;
  destinations: TransferDestination[];
  isLoadingDestinations: boolean;
  isTransferring: boolean;
  onTransfer: (
    destinationServiceId: string,
    reason?: string,
    notes?: string,
  ) => void;
}

export function TransferTicketModal({
  isOpen,
  onClose,
  ticketNumber,
  currentServiceName,
  destinations,
  isLoadingDestinations,
  isTransferring,
  onTransfer,
}: TransferTicketModalProps) {
  const [selectedDestination, setSelectedDestination] =
    useState<TransferDestination | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<"select" | "confirm">("select");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDestination(null);
      setReason("");
      setNotes("");
      setSearchQuery("");
      setStep("select");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Group destinations by branch
  const groupedDestinations = destinations.reduce<
    Record<string, { branchName: string; services: TransferDestination[] }>
  >((acc, dest) => {
    if (!acc[dest.branchId]) {
      acc[dest.branchId] = { branchName: dest.branchName, services: [] };
    }
    acc[dest.branchId].services.push(dest);
    return acc;
  }, {});

  // Filter destinations by search query
  const filteredGroups = Object.entries(groupedDestinations)
    .map(([branchId, group]) => ({
      branchId,
      branchName: group.branchName,
      services: group.services.filter(
        (s) =>
          s.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.departmentName.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((group) => group.services.length > 0);

  const handleSelectDestination = (dest: TransferDestination) => {
    setSelectedDestination(dest);
    setStep("confirm");
  };

  const handleConfirmTransfer = () => {
    if (!selectedDestination) return;
    onTransfer(
      selectedDestination.serviceId,
      reason || undefined,
      notes || undefined,
    );
  };

  const handleBack = () => {
    setStep("select");
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all max-h-[85vh] flex flex-col">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-info-100 flex items-center justify-center border border-info-200">
                  <ArrowRightLeft className="w-6 h-6 text-info" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Transfer Ticket
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Ticket {ticketNumber}
                    {currentServiceName && ` • ${currentServiceName}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {step === "select" && (
                <div className="p-6">
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search services or departments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Destinations List */}
                  {isLoadingDestinations ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="font-medium">No destinations available</p>
                      <p className="text-sm mt-1">
                        {searchQuery
                          ? "Try a different search term"
                          : "No other services found in your organization"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredGroups.map(
                        ({ branchId, branchName, services }) => (
                          <div key={branchId}>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                              {branchName}
                            </h4>
                            <div className="space-y-2">
                              {services.map((dest) => (
                                <button
                                  key={dest.serviceId}
                                  onClick={() => handleSelectDestination(dest)}
                                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-all duration-150 group"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 truncate">
                                        {dest.serviceName}
                                      </p>
                                      <p className="text-sm text-gray-500 truncate">
                                        {dest.departmentName}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                                      {dest.estimatedTime && (
                                        <span className="flex items-center text-xs text-gray-500">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {dest.estimatedTime}min
                                        </span>
                                      )}
                                      <span className="flex items-center text-xs text-gray-500">
                                        <Users className="w-3 h-3 mr-1" />
                                        {dest.waitingCount}
                                      </span>
                                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === "confirm" && selectedDestination && (
                <div className="p-6">
                  {/* Selected destination summary */}
                  <div className="bg-info-50 border border-info-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-info-700 font-medium mb-1">
                      Transfer to:
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedDestination.serviceName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedDestination.departmentName} •{" "}
                      {selectedDestination.branchName}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {selectedDestination.estimatedTime && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Est. {selectedDestination.estimatedTime}min
                        </span>
                      )}
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {selectedDestination.waitingCount} waiting
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <label
                      htmlFor="transfer-reason"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Reason for Transfer{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <select
                      id="transfer-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      aria-label="Reason for transfer"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select a reason...</option>
                      <option value="requires_specialist">
                        Requires Specialist
                      </option>
                      <option value="additional_tests">
                        Additional Tests Needed
                      </option>
                      <option value="referral">
                        Referral to Another Department
                      </option>
                      <option value="patient_request">Patient Request</option>
                      <option value="scheduling">Scheduling Conflict</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Additional Notes{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any relevant notes for the receiving service..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Info notice */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                    <p>
                      The ticket will be moved to the <strong>end</strong> of
                      the destination queue with the same ticket number.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-gray-200 flex-shrink-0">
              {step === "select" ? (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirmTransfer}
                    loading={isTransferring}
                    disabled={isTransferring}
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Confirm Transfer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
