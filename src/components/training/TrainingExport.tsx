
import React from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, File } from "lucide-react";
import { TrainingMatrix } from "@/types/training";
import { toast } from "@/hooks/use-toast";

interface TrainingExportProps {
  matrixData: TrainingMatrix;
}

const TrainingExport: React.FC<TrainingExportProps> = ({ matrixData }) => {
  const [open, setOpen] = React.useState(false);
  
  const handleExportCSV = () => {
    try {
      // Create header row
      const headers = ["Staff ID", "Staff Name", "Role", "Department"];
      matrixData.trainings.forEach(training => {
        headers.push(training.title);
      });
      
      // Create data rows
      const rows = matrixData.staffMembers.map(staff => {
        const rowData = [staff.id, staff.name, staff.role, staff.department];
        
        matrixData.trainings.forEach(training => {
          const cell = matrixData.data[staff.id]?.[training.id];
          if (cell) {
            rowData.push(cell.status);
          } else {
            rowData.push("N/A");
          }
        });
        
        return rowData;
      });
      
      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "training_matrix.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setOpen(false);
      toast({
        title: "Export Successful",
        description: "Training matrix exported to CSV",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    }
  };
  
  const handleExportPDF = () => {
    toast({
      title: "Export Coming Soon",
      description: "PDF export functionality will be available soon",
    });
    setOpen(false);
  };
  
  const handleExportExcel = () => {
    toast({
      title: "Export Coming Soon",
      description: "Excel export functionality will be available soon",
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 whitespace-nowrap">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            className="justify-start gap-2 px-2 py-1.5 h-auto"
            onClick={handleExportCSV}
          >
            <FileText className="h-4 w-4" />
            <span>Export as CSV</span>
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-2 px-2 py-1.5 h-auto"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export as Excel</span>
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-2 px-2 py-1.5 h-auto"
            onClick={handleExportPDF}
          >
            <File className="h-4 w-4" />
            <span>Export as PDF</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TrainingExport;
