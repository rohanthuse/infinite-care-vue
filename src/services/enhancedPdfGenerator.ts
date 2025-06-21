
import { format } from "date-fns";

export interface ReportPDFData {
  branchName: string;
  reportType: string;
  dateRange: { from: Date; to: Date };
  data: any;
}

export const generateReportPDF = (reportData: ReportPDFData): void => {
  // Create a simple HTML content for PDF generation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportData.reportType} Report - ${reportData.branchName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .date-range { text-align: center; color: #666; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .chart-placeholder { 
          border: 1px solid #ddd; 
          padding: 20px; 
          text-align: center; 
          background-color: #f9f9f9; 
        }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Med-Infinite Care Services</h1>
        <h2>${reportData.reportType} Report</h2>
        <h3>${reportData.branchName}</h3>
      </div>
      
      <div class="date-range">
        Report Period: ${format(reportData.dateRange.from, 'dd/MM/yyyy')} - ${format(reportData.dateRange.to, 'dd/MM/yyyy')}
      </div>
      
      <div class="section">
        <h3>Report Data</h3>
        <div class="chart-placeholder">
          Charts and detailed data would be rendered here
        </div>
      </div>
      
      <div class="section">
        <p><strong>Generated:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        <p><strong>Report Type:</strong> ${reportData.reportType}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
};

export const generateCarePlanDetailPDF = (carePlan: any, clientData: any, branchName: string): void => {
  const reportData: ReportPDFData = {
    branchName,
    reportType: "Care Plan Detail",
    dateRange: { from: new Date(), to: new Date() },
    data: { carePlan, clientData }
  };
  
  generateReportPDF(reportData);
};

export const generateBookingReportPDF = (bookings: any[], filters: any, branchName: string, title: string): void => {
  const reportData: ReportPDFData = {
    branchName,
    reportType: title,
    dateRange: filters.dateRange || { from: new Date(), to: new Date() },
    data: bookings
  };
  
  generateReportPDF(reportData);
};

export const generateClientReportPDF = (clients: any[], filters: any, branchName: string, title: string): void => {
  const reportData: ReportPDFData = {
    branchName,
    reportType: title,
    dateRange: filters.dateRange || { from: new Date(), to: new Date() },
    data: clients
  };
  
  generateReportPDF(reportData);
};

export const generateStaffReportPDF = (staff: any[], filters: any, branchName: string, title: string): void => {
  const reportData: ReportPDFData = {
    branchName,
    reportType: title,
    dateRange: filters.dateRange || { from: new Date(), to: new Date() },
    data: staff
  };
  
  generateReportPDF(reportData);
};
