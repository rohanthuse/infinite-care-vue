
import React from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, File } from "lucide-react";
import { Training, StaffMember } from "@/types/training";
import { toast } from "sonner";
import { generateTrainingCertificate, generateTrainingSummaryPDF } from "@/utils/trainingCertificateGenerator";

interface TrainingExportUserProps {
  trainings: Training[];
  staffMember: StaffMember;
}

const TrainingExportUser: React.FC<TrainingExportUserProps> = ({ 
  trainings,
  staffMember
}) => {
  const handleExportSummary = () => {
    try {
      generateTrainingSummaryPDF(trainings, staffMember);
      
      toast.success("Training record exported successfully", {
        description: "Your training summary has been downloaded as a PDF"
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: "There was an error exporting your training record"
      });
    }
  };
  
  const handleExportCertificate = (training: Training) => {
    try {
      generateTrainingCertificate(training, staffMember);
      
      toast.success("Certificate exported successfully", {
        description: `Certificate for ${training.title} has been downloaded`
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: "There was an error exporting the certificate"
      });
    }
  };

  // Count the number of completed trainings with certificates
  const completedTrainingsCount = trainings.filter(t => t.status === 'completed').length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 whitespace-nowrap">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={handleExportSummary}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          <span>Export Training Record</span>
        </DropdownMenuItem>
        
        {completedTrainingsCount > 0 ? (
          <>
            <DropdownMenuItem
              className="font-medium text-xs px-2 py-1 text-gray-500 cursor-default"
              disabled
            >
              Export Certificates
            </DropdownMenuItem>
            
            {trainings
              .filter(t => t.status === 'completed')
              .map(training => (
                <DropdownMenuItem
                  key={training.id}
                  onClick={() => handleExportCertificate(training)}
                  className="cursor-pointer pl-4"
                >
                  <File className="h-4 w-4 mr-2" />
                  <span className="truncate">{training.title}</span>
                </DropdownMenuItem>
              ))
            }
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TrainingExportUser;
