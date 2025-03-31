
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { getStatusBadgeClass } from "@/utils/statusHelpers";

interface PatientHeaderProps {
  carePlan: {
    id: string;
    patientName: string;
    patientId: string;
    avatar: string;
    status: string;
  };
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ carePlan }) => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium">
        {carePlan.avatar}
      </div>
      <div>
        <h2 className="text-2xl font-bold">{carePlan.patientName}</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Patient ID: {carePlan.patientId}</span>
          <span>•</span>
          <span>Plan ID: {carePlan.id}</span>
          <span>•</span>
          <Badge variant="outline" className={getStatusBadgeClass(carePlan.status)}>
            {carePlan.status}
          </Badge>
        </div>
      </div>
    </div>
  );
};
