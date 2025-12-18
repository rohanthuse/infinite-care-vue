import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ReportExporter } from "@/utils/reportExporter";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExportServiceReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  branchId: string;
  branchName?: string;
  clientName: string;
}

export function ExportServiceReportsDialog({
  open,
  onOpenChange,
  clientId,
  branchId,
  branchName,
  clientName,
}: ExportServiceReportsDialogProps) {
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  // Fetch ALL service reports for the client (not just approved ones)
  const { data: allReports } = useQuery({
    queryKey: ['export-service-reports', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('client_service_reports')
        .select(`
          *,
          staff (
            first_name,
            last_name,
            email
          )
        `)
        .eq('client_id', clientId)
        .order('service_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(clientId),
  });

  const handleExport = async () => {
    if (!allReports || allReports.length === 0) {
      toast.error("No service reports available");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date must be after start date");
      return;
    }

    setIsExporting(true);
    
    let filteredReports: any[] = [];

    try {
      // Filter reports by date range
      filteredReports = allReports.filter((report) => {
        const reportDate = new Date(report.service_date);
        return reportDate >= startDate && reportDate <= endDate;
      });

      if (filteredReports.length === 0) {
        toast.error("No service reports found in the selected date range");
        setIsExporting(false);
        return;
      }

      // Fetch detailed medication and task data for each report
      const reportsWithDetails = await Promise.all(
        filteredReports.map(async (report) => {
          let medications: any[] = [];
          let tasks: any[] = [];

          if (report.visit_record_id) {
            // Fetch medications
            const { data: medsData } = await supabase
              .from("visit_medications")
              .select("*")
              .eq("visit_record_id", report.visit_record_id)
              .order("prescribed_time", { ascending: true });

            medications = medsData || [];

            // Fetch tasks
            const { data: tasksData } = await supabase
              .from("visit_tasks")
              .select("*")
              .eq("visit_record_id", report.visit_record_id)
              .order("task_category", { ascending: true });

            tasks = tasksData || [];
          }

          return {
            ...report,
            medications,
            tasks,
          };
        })
      );

      // Export using the dedicated service reports PDF generator
      await ReportExporter.generateServiceReportsPDF({
        reports: reportsWithDetails,
        clientName,
        branchId,
        branchName,
        dateRange: { from: startDate, to: endDate },
        fileName: `service_reports_${clientName.replace(/\s+/g, "_")}_${format(startDate, "yyyyMMdd")}_${format(endDate, "yyyyMMdd")}.pdf`,
        metadata: {
          totalRecords: allReports.length,
          exportedRecords: filteredReports.length,
          filters: {
            Client: clientName,
            "Date Range": `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`,
          },
        },
      });

      toast.success(
        `Successfully exported ${filteredReports.length} service report${filteredReports.length !== 1 ? "s" : ""}`
      );
      onOpenChange(false);
    } catch (error) {
      console.error("❌ Service Report Export Error:", error);
      console.error("Error details:", {
        reportsCount: filteredReports?.length,
        clientId,
        dateRange: { from: startDate, to: endDate },
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage = error instanceof Error 
        ? `Failed to export: ${error.message}` 
        : "Failed to export service reports. Please try again.";
      
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Service Reports</DialogTitle>
          <DialogDescription>
            Select date range to export service reports for {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-pulse" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
