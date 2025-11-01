import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { ReportExporter } from "@/utils/reportExporter";
import { WeeklyStat } from "@/data/hooks/useBranchChartData";
import { useToast } from "@/hooks/use-toast";

interface ChartExportMenuProps {
  chartData: WeeklyStat[];
  branchName?: string;
  chartTitle: string;
}

export const ChartExportMenu: React.FC<ChartExportMenuProps> = ({ 
  chartData, 
  branchName, 
  chartTitle 
}) => {
  const { toast } = useToast();

  const handleExportPDF = () => {
    if (!chartData || chartData.length === 0) {
      toast({
        title: "No data available",
        description: "There is no data to export.",
        variant: "destructive",
      });
      return;
    }

    ReportExporter.exportChartData({
      title: chartTitle,
      weeklyStats: chartData,
      branchName,
      format: 'pdf'
    });

    toast({
      title: "PDF exported",
      description: "Your chart has been exported as PDF.",
    });
  };

  const handleExportCSV = () => {
    if (!chartData || chartData.length === 0) {
      toast({
        title: "No data available",
        description: "There is no data to export.",
        variant: "destructive",
      });
      return;
    }

    ReportExporter.exportChartData({
      title: chartTitle,
      weeklyStats: chartData,
      branchName,
      format: 'csv'
    });

    toast({
      title: "CSV exported",
      description: "Your chart has been exported as CSV.",
    });
  };

  const handlePrint = () => {
    if (!chartData || chartData.length === 0) {
      toast({
        title: "No data available",
        description: "There is no data to print.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
      toast({
        title: "Pop-up blocked",
        description: "Please allow pop-ups to print the chart.",
        variant: "destructive",
      });
      return;
    }

    const tableRows = chartData.map(row => 
      `<tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${row.day}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${row.visits}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${row.bookings}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">£${row.revenue.toFixed(2)}</td>
      </tr>`
    ).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${chartTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            h2 { font-size: 16px; color: #666; margin-bottom: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${chartTitle}</h1>
          ${branchName ? `<h2>Branch: ${branchName}</h2>` : ''}
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Visits</th>
                <th>Bookings</th>
                <th>Revenue (£)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileDown className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Chart
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
