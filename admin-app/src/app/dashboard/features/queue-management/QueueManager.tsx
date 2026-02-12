import { Users } from "lucide-react";
import { Branch, Department, Service } from "../shared/types";
import { Label, Select } from "@/components/ui/FormControls";

interface QueueManagerProps {
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (departmentId: string) => void;
  selectedService: string;
  setSelectedService: (serviceId: string) => void;
  branches: Branch[];
  departments: Department[];
  services: Service[];
  // Role-based props
  canSelectBranch?: boolean;
  canSelectDepartment?: boolean;
  currentUserRole?: string | null;
  assignedDepartmentName?: string | null;
}

export const QueueManager = ({
  selectedBranch,
  setSelectedBranch,
  selectedDepartment,
  setSelectedDepartment,
  selectedService,
  setSelectedService,
  branches,
  departments,
  services,
  canSelectBranch = true,
  canSelectDepartment = true,
  currentUserRole,
  assignedDepartmentName,
}: QueueManagerProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Queue Manager
          </h2>
          <p className="text-gray-700 text-sm">
            Control and monitor queue operations
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Branch Selection */}
        {canSelectBranch && (
          <div>
            <Label>Select Branch</Label>
            <Select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              aria-label="Select Branch"
            >
              <option value="">Choose a branch...</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.address}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Department Selection - Hidden for employee users */}
        {canSelectDepartment && (
          <div>
            <Label>Select Department</Label>
            <Select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              aria-label="Select Department"
            >
              <option value="">Choose a department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Employee Department Badge */}
        {currentUserRole === "employee" && assignedDepartmentName && (
          <div className="bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <div>
                <p className="text-xs font-medium text-gray-700">Assigned Department</p>
                <p className="text-base font-semibold text-gray-900">{assignedDepartmentName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Service Selection */}
        {selectedDepartment && services.length > 0 && (
          <div>
            <Label>Select Service</Label>
            <Select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              aria-label="Select Service"
            >
              <option value="">All Services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.estimated_time}min)
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};
