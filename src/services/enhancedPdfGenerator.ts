
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// Extend jsPDF type to include autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Med-Infinite brand colors
const BRAND_COLORS = {
  primary: [0, 83, 156] as [number, number, number], // #00539C
  secondary: [46, 150, 208] as [number, number, number], // #2E96D0
  accent: [100, 100, 100] as [number, number, number], // Gray
  success: [39, 174, 96] as [number, number, number], // Green
  danger: [231, 76, 60] as [number, number, number], // Red
  light: [240, 240, 240] as [number, number, number], // Light Gray
  white: [255, 255, 255] as [number, number, number]
};

interface PdfOptions {
  title: string;
  branchName: string;
  reportType?: string;
  includeWatermark?: boolean;
  confidential?: boolean;
}

export class EnhancedPdfGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Add Med-Infinite header with branding
  private addHeader(options: PdfOptions): number {
    // Header background
    this.doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');

    // Company logo/name
    this.doc.setFontSize(24);
    this.doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
    this.doc.text("Med-Infinite", 20, 20);

    // Branch name
    this.doc.setFontSize(12);
    this.doc.text(options.branchName, 20, 30);

    // Report title
    this.doc.setFontSize(18);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text(options.title, 20, 55);

    // Report type and date
    this.doc.setFontSize(10);
    this.doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
    if (options.reportType) {
      this.doc.text(`Report Type: ${options.reportType}`, 20, 65);
    }
    this.doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 20, 72);

    return 85;
  }

  // Add watermark
  private addWatermark(): void {
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;
    
    this.doc.setFontSize(50);
    this.doc.setTextColor(245, 245, 245);
    this.doc.text("Med-Infinite", centerX, centerY, { 
      align: "center",
      angle: 45
    });
  }

  // Add footer with pagination and confidentiality
  private addFooter(pageNum: number, totalPages: number, confidential: boolean = true): void {
    this.doc.setFontSize(8);
    this.doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
    
    // Page number
    this.doc.text(
      `Page ${pageNum} of ${totalPages}`,
      this.pageWidth / 2,
      this.pageHeight - 15,
      { align: "center" }
    );

    // Confidentiality notice
    if (confidential) {
      this.doc.text(
        "CONFIDENTIAL - Med-Infinite Healthcare Management System",
        this.pageWidth / 2,
        this.pageHeight - 8,
        { align: "center" }
      );
    }
  }

  // Create booking report PDF
  generateBookingReport(bookings: any[], filters: any, options: PdfOptions): void {
    this.currentY = this.addHeader(options);

    if (options.includeWatermark) {
      this.addWatermark();
    }

    // Summary section
    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Report Summary", 20, this.currentY);
    this.currentY += 10;

    // Summary stats
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'done').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : '0';

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Total Bookings: ${totalBookings}`, 20, this.currentY);
    this.doc.text(`Completed: ${completedBookings}`, 20, this.currentY + 8);
    this.doc.text(`Cancelled: ${cancelledBookings}`, 20, this.currentY + 16);
    this.doc.text(`Completion Rate: ${completionRate}%`, 20, this.currentY + 24);
    this.currentY += 40;

    // Filter information
    if (filters.dateRange) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
      this.doc.text(
        `Date Range: ${format(filters.dateRange.from, "dd MMM yyyy")} - ${format(filters.dateRange.to, "dd MMM yyyy")}`,
        20,
        this.currentY
      );
      this.currentY += 15;
    }

    // Bookings table
    if (bookings.length > 0) {
      const tableColumns = ["Date", "Time", "Client", "Carer", "Status", "Duration"];
      const tableRows = bookings.map(booking => {
        const duration = this.calculateDuration(booking.startTime, booking.endTime);
        return [
          format(new Date(booking.date), "dd MMM yyyy"),
          `${booking.startTime} - ${booking.endTime}`,
          booking.clientName || 'N/A',
          booking.carerName || 'N/A',
          booking.status || 'N/A',
          `${duration}m`
        ];
      });

      autoTable(this.doc, {
        head: [tableColumns],
        body: tableRows,
        startY: this.currentY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: BRAND_COLORS.primary,
          textColor: BRAND_COLORS.white,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: BRAND_COLORS.light,
        },
      });
    }

    // Add pagination
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages, options.confidential !== false);
    }

    // Save with proper filename
    const dateStr = format(new Date(), "yyyy-MM-dd");
    this.doc.save(`Med-Infinite_Booking_Report_${dateStr}.pdf`);
  }

  // Generate client report PDF
  generateClientReport(clients: any[], options: PdfOptions): void {
    this.currentY = this.addHeader(options);

    if (options.includeWatermark) {
      this.addWatermark();
    }

    // Summary
    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Client Summary", 20, this.currentY);
    this.currentY += 15;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Total Clients: ${clients.length}`, 20, this.currentY);
    this.doc.text(`Active Clients: ${clients.filter(c => c.status === 'active').length}`, 20, this.currentY + 8);
    this.currentY += 25;

    // Clients table
    if (clients.length > 0) {
      const tableColumns = ["Name", "Email", "Phone", "Status", "Registered"];
      const tableRows = clients.map(client => [
        `${client.first_name} ${client.last_name}`,
        client.email || 'N/A',
        client.phone || 'N/A',
        client.status || 'N/A',
        client.registered_on ? format(new Date(client.registered_on), "dd MMM yyyy") : 'N/A'
      ]);

      autoTable(this.doc, {
        head: [tableColumns],
        body: tableRows,
        startY: this.currentY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: BRAND_COLORS.primary,
          textColor: BRAND_COLORS.white,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: BRAND_COLORS.light,
        },
      });
    }

    // Add pagination
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages, options.confidential !== false);
    }

    const dateStr = format(new Date(), "yyyy-MM-dd");
    this.doc.save(`Med-Infinite_Client_Report_${dateStr}.pdf`);
  }

  // Generate staff report PDF
  generateStaffReport(staff: any[], options: PdfOptions): void {
    this.currentY = this.addHeader(options);

    if (options.includeWatermark) {
      this.addWatermark();
    }

    // Summary
    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Staff Summary", 20, this.currentY);
    this.currentY += 15;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Total Staff: ${staff.length}`, 20, this.currentY);
    this.currentY += 20;

    // Staff table
    if (staff.length > 0) {
      const tableColumns = ["Name", "Position", "Email", "Status"];
      const tableRows = staff.map(member => [
        `${member.first_name} ${member.last_name}`,
        member.position || 'N/A',
        member.email || 'N/A',
        member.status || 'Active'
      ]);

      autoTable(this.doc, {
        head: [tableColumns],
        body: tableRows,
        startY: this.currentY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: BRAND_COLORS.primary,
          textColor: BRAND_COLORS.white,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: BRAND_COLORS.light,
        },
      });
    }

    // Add pagination
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages, options.confidential !== false);
    }

    const dateStr = format(new Date(), "yyyy-MM-dd");
    this.doc.save(`Med-Infinite_Staff_Report_${dateStr}.pdf`);
  }

  // Helper method to calculate duration
  private calculateDuration(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  }
}

// Export convenience functions
export const generateBookingReportPDF = (
  bookings: any[], 
  filters: any, 
  branchName: string,
  reportType: string = "Booking Report"
) => {
  const generator = new EnhancedPdfGenerator();
  generator.generateBookingReport(bookings, filters, {
    title: reportType,
    branchName,
    reportType,
    includeWatermark: true,
    confidential: true
  });
};

export const generateClientReportPDF = (
  clients: any[], 
  branchName: string
) => {
  const generator = new EnhancedPdfGenerator();
  generator.generateClientReport(clients, {
    title: "Client Report",
    branchName,
    reportType: "Client Analytics",
    includeWatermark: true,
    confidential: true
  });
};

export const generateStaffReportPDF = (
  staff: any[], 
  branchName: string
) => {
  const generator = new EnhancedPdfGenerator();
  generator.generateStaffReport(staff, {
    title: "Staff Report",
    branchName,    
    reportType: "Staff Analytics",
    includeWatermark: true,
    confidential: true
  });
};
