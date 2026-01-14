
import React from "react";
import { format } from "date-fns";
import { X, FileEdit, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generateCarePlanDetailPDF } from "@/services/enhancedPdfGenerator";
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
    assignedToType?: string;
    avatar: string;
  };
  clientData?: {
    clientProfile?: any;
    personalInfo?: any;
    medicalInfo?: any;
    dietaryRequirements?: any;
    personalCare?: any;
    assessments?: any[];
    equipment?: any[];
    riskAssessments?: any[];
    serviceActions?: any[];
    aboutMe?: any;
    goals?: any[];
    activities?: any[];
    medications?: any[];
    keyContacts?: any[];
    consent?: any;
    general?: any;
    hobbies?: any[];
  };
  branchName?: string;
  branchId?: string;
  onClose: () => void;
  onEdit: () => void;
}

export const CarePlanHeader: React.FC<CarePlanHeaderProps> = ({
  carePlan,
  clientData,
  branchName = "Med-Infinite",
  branchId,
  onClose,
  onEdit,
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportCarePlan = async () => {
    setIsExporting(true);
    try {
      await generateCarePlanDetailPDF(carePlan, clientData || {}, branchName, branchId);
      toast.success("Care plan exported successfully");
    } catch (error) {
      console.error("Error exporting care plan:", error);
      toast.error("Failed to export care plan");
    } finally {
      setIsExporting(false);
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
        <Button 
          variant="outline" 
          onClick={handleExportCarePlan} 
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{isExporting ? 'Exporting...' : 'Export'}</span>
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
