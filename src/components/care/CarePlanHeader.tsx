
import React from "react";
import { format } from "date-fns";
import { X, FileEdit, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generatePDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";

interface CarePlanHeaderProps {
  carePlan: {
    id: string;
    patientName: string;
    patientId: string;
    dateCreated: Date;
    lastUpdated: Date;
    status: string;
    assignedTo: string;
    avatar: string;
  };
  onClose: () => void;
  onEdit: () => void;
}

export const CarePlanHeader: React.FC<CarePlanHeaderProps> = ({
  carePlan,
  onClose,
  onEdit,
}) => {
  const handleExportCarePlan = () => {
    try {
      generatePDF({
        id: carePlan.id,
        title: `Care Plan for ${carePlan.patientName}`,
        date: format(carePlan.dateCreated, 'yyyy-MM-dd'),
        status: carePlan.status,
        signedBy: "System Generated"
      });
      toast.success("Care plan exported successfully");
    } catch (error) {
      console.error("Error exporting care plan:", error);
      toast.error("Failed to export care plan");
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <div className="bg-blue-100 text-blue-600 w-full h-full flex items-center justify-center text-sm font-medium">
            {carePlan.avatar}
          </div>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{carePlan.patientName}</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Plan ID: {carePlan.id}</span>
            <span>•</span>
            <Badge>{carePlan.status}</Badge>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={handleExportCarePlan} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
        <Button variant="outline" onClick={onEdit} className="flex items-center gap-2">
          <FileEdit className="h-4 w-4" />
          <span>Edit</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
